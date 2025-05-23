"use client";

import React, { useState, useEffect, useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useRepo } from '../lib/repoContext';
import { fetchContributions } from '../lib/gitlabApi';
import { fetchGitHubContributions } from '../lib/githubApi';
import { AggregatedContribution } from '../types';
import { useDateRange } from '../lib/dateContext';
import axios from 'axios';

type YearOption = {
  label: string;
  value: number;
  startDate: Date;
  endDate: Date;
};

export default function Heatmap() {
  const { gitlabInstances, githubInstances, loading } = useRepo();
  const { dateRange, setDateRange } = useDateRange();
  const [aggregatedData, setAggregatedData] = useState<AggregatedContribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Generate year options (current year and previous years)
  const currentYear = new Date().getFullYear();
  const generateYearOptions = (): YearOption[] => {
    const options: YearOption[] = [];
    
    // Add last 365 days option
    const today = new Date();
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    
    options.push({
      label: 'Last 12 months',
      value: 0, // Special value for last 12 months
      startDate: lastYear,
      endDate: today
    });
    
    // Add "All Time" option
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10); // Go back 10 years
    
    options.push({
      label: 'All Time (10 years)',
      value: -1, // Special value for all time
      startDate: tenYearsAgo,
      endDate: today
    });
    
    // Add specific calendar years (going back 10 years)
    for (let year = currentYear; year >= currentYear - 10; year--) {
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = year === currentYear 
        ? new Date() // Current date for current year
        : new Date(year, 11, 31); // December 31st for past years
      
      options.push({
        label: `${year}`,
        value: year,
        startDate,
        endDate
      });
    }
    
    return options;
  };
  
  const yearOptions = generateYearOptions();
  
  // Function to handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yearValue = parseInt(e.target.value);
    const option = yearOptions.find(opt => opt.value === yearValue);
    if (option) {
      // Add one day to endDate to ensure contributions for the end date are included
      const tomorrowDate = new Date(option.endDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      
      // Update the date context
      setDateRange({
        startDate: option.startDate,
        endDate: option.endDate,
        startDateString: option.startDate.toISOString().split('T')[0],
        endDateString: tomorrowDate.toISOString().split('T')[0],
        label: option.label,
        value: option.value
      });
    }
  };

  // We're still using the aggregateContributions function, but importing it locally
  // since it doesn't need to change
  const aggregateContributions = (
    contributionsArray: unknown[][]
  ): Map<string, { count: number, contributions: { instanceId: string, count: number }[] }> => {
    const aggregatedMap = new Map<string, { 
      count: number, 
      contributions: { instanceId: string, count: number }[] 
    }>();
    
    type Contribution = {
      date: string;
      count: number;
      instanceId: string;
    };
    
    contributionsArray.flat().forEach((contribution) => {
      const typedContribution = contribution as Contribution;
      const existing = aggregatedMap.get(typedContribution.date);
      
      if (existing) {
        existing.count += typedContribution.count;
        existing.contributions.push({
          instanceId: typedContribution.instanceId,
          count: typedContribution.count
        });
      } else {
        aggregatedMap.set(typedContribution.date, {
          count: typedContribution.count,
          contributions: [{
            instanceId: typedContribution.instanceId,
            count: typedContribution.count
          }]
        });
      }
    });
    
    return aggregatedMap;
  };

  useEffect(() => {
    // Skip if there are no instances configured yet or if still loading
    if ((gitlabInstances.length === 0 && githubInstances.length === 0) || loading) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        console.log("Fetching data with date range:", {
          startDate: dateRange.startDateString,
          endDate: dateRange.endDateString
        });
        
        // Fetch contributions for each GitLab instance
        const gitlabContributionsPromises = gitlabInstances.map(async instance => {
          try {
            // First get the current user's username from GitLab
            const response = await axios.get(`${instance.baseUrl}/api/v4/user`, {
              headers: {
                'Private-Token': instance.token
              }
            });
            const username = response.data.username;
            return fetchContributions(instance, username, dateRange.startDateString, dateRange.endDateString);
          } catch (error) {
            console.error(`Error fetching user data from GitLab (${instance.name}):`, error);
            return [];
          }
        });
        
        // Fetch contributions for each GitHub instance
        const githubContributionsPromises = githubInstances.map(instance => 
          fetchGitHubContributions(instance, dateRange.startDateString, dateRange.endDateString)
        );
        
        // Wait for all promises to resolve
        const allPromises = [...gitlabContributionsPromises, ...githubContributionsPromises];
        const contributionsResults = await Promise.all(allPromises);
        
        // Aggregate contributions
        const aggregatedMap = aggregateContributions(contributionsResults);
        
        // Convert to array format expected by the heatmap
        const formattedData = Array.from(aggregatedMap.entries()).map(([date, data]) => ({
          date,
          count: data.count,
          contributions: data.contributions
        }));
        
        console.log("Aggregated heatmap data:", formattedData);
        
        setAggregatedData(formattedData);
      } catch (error) {
        console.error('Error fetching contribution data:', error);
        setError('Failed to fetch contribution data. Please check your instances and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [gitlabInstances, githubInstances, loading, dateRange.startDateString, dateRange.endDateString]);

  // Find the maximum contribution count in the current data
  const maxContributionCount = useMemo(() => {
    if (aggregatedData.length === 0) return 0;
    
    // Find the maximum contribution count
    const max = Math.max(...aggregatedData.map(item => item.count));
    console.log(`Max contribution count: ${max}`);
    
    // Log distribution of contributions for debugging
    const counts: Record<number, number> = {};
    aggregatedData.forEach(item => {
      counts[item.count] = (counts[item.count] || 0) + 1;
    });
    console.log("Distribution of contribution counts:", counts);
    
    return max;
  }, [aggregatedData]);
  
  // Log max value for debugging
  useEffect(() => {
    if (aggregatedData.length > 0) {
      console.log(`Contribution stats - Max: ${maxContributionCount}`);
    }
  }, [maxContributionCount, aggregatedData]);

  // Calculate color based on a more robust gradient scale
  const getColor = (count: number) => {
    if (count === 0) return 'color-empty';
    
    // Ensure we have a valid max (if max is 0, treat any contributions as max)
    const effectiveMax = maxContributionCount || 1;
    
    // Special case: if max is very small (1-3), use fixed colors to ensure visual distinction
    if (maxContributionCount <= 3) {
      if (count === 1) return 'color-scale-3';
      if (count === 2) return 'color-scale-6';
      return 'color-scale-10';
    }
    
    // Calculate percentage of max (0 to 1)
    const percentage = count / effectiveMax;
    console.log(`Color for count ${count}/${effectiveMax} = ${percentage * 100}%`);
    
    // Create 10 levels of color intensity with logarithmic scale for better visual differentiation
    if (percentage <= 0.05) return 'color-scale-1';
    if (percentage <= 0.1) return 'color-scale-2';
    if (percentage <= 0.2) return 'color-scale-3';
    if (percentage <= 0.3) return 'color-scale-4';
    if (percentage <= 0.4) return 'color-scale-5';
    if (percentage <= 0.5) return 'color-scale-6';
    if (percentage <= 0.6) return 'color-scale-7';
    if (percentage <= 0.7) return 'color-scale-8';
    if (percentage <= 0.85) return 'color-scale-9';
    return 'color-scale-10';
  };

  if (gitlabInstances.length === 0 && githubInstances.length === 0) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">Contribution Heatmap</h2>
        <p className="text-muted-foreground">Add GitLab or GitHub instances to see your contribution heatmap.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Contribution Heatmap</h2>
          {!isLoading && aggregatedData.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {aggregatedData.reduce((total, item) => total + item.count, 0)} contributions in {
                dateRange.label
              } (max: {maxContributionCount} per day)
            </p>
          )}
        </div>
        <div className="relative">
          <select
            value={dateRange.value}
            onChange={handleYearChange}
            className="p-2 pr-8 rounded border border-border bg-input text-sm appearance-none"
            aria-label="Select time period"
          >
            {yearOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2">
            <svg className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      
      {isLoading && (
        <div className="animate-pulse p-8">
          <div className="flex flex-col space-y-4">
            <div className="skeleton h-4 w-3/4 mb-8"></div>
            <div className="skeleton h-24 w-full"></div>
            <div className="skeleton h-24 w-full"></div>
            <div className="flex justify-end mt-2">
              <div className="skeleton h-3 w-32"></div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="heatmap-container">
          <style jsx>{`
            .color-empty { fill: var(--color-empty) !important; }
            .color-scale-1 { fill: var(--color-scale-1) !important; }
            .color-scale-2 { fill: var(--color-scale-2) !important; }
            .color-scale-3 { fill: var(--color-scale-3) !important; }
            .color-scale-4 { fill: var(--color-scale-4) !important; }
            .color-scale-5 { fill: var(--color-scale-5) !important; }
            .color-scale-6 { fill: var(--color-scale-6) !important; }
            .color-scale-7 { fill: var(--color-scale-7) !important; }
            .color-scale-8 { fill: var(--color-scale-8) !important; }
            .color-scale-9 { fill: var(--color-scale-9) !important; }
            .color-scale-10 { fill: var(--color-scale-10) !important; }
            
            /* Override react-calendar-heatmap styles for dark mode */
            :global(.react-calendar-heatmap) {
              width: 100%;
            }
            
            :global(.react-calendar-heatmap text) {
              fill: var(--foreground);
              font-size: 10px;
            }
            
            /* Make sure colors are applied */
            :global(.react-calendar-heatmap .color-empty) { fill: var(--color-empty) !important; }
            :global(.react-calendar-heatmap .color-scale-1) { fill: var(--color-scale-1) !important; }
            :global(.react-calendar-heatmap .color-scale-2) { fill: var(--color-scale-2) !important; }
            :global(.react-calendar-heatmap .color-scale-3) { fill: var(--color-scale-3) !important; }
            :global(.react-calendar-heatmap .color-scale-4) { fill: var(--color-scale-4) !important; }
            :global(.react-calendar-heatmap .color-scale-5) { fill: var(--color-scale-5) !important; }
            :global(.react-calendar-heatmap .color-scale-6) { fill: var(--color-scale-6) !important; }
            :global(.react-calendar-heatmap .color-scale-7) { fill: var(--color-scale-7) !important; }
            :global(.react-calendar-heatmap .color-scale-8) { fill: var(--color-scale-8) !important; }
            :global(.react-calendar-heatmap .color-scale-9) { fill: var(--color-scale-9) !important; }
            :global(.react-calendar-heatmap .color-scale-10) { fill: var(--color-scale-10) !important; }
            
            /* Adjust the heatmap to start with Sunday */
            :global(.react-calendar-heatmap .react-calendar-heatmap-month-labels) {
              order: 1;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels) {
              order: 0;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(1)) {
              order: 7;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(2)) {
              order: 1;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(3)) {
              order: 2;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(4)) {
              order: 3;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(5)) {
              order: 4;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(6)) {
              order: 5;
            }
            
            :global(.react-calendar-heatmap .react-calendar-heatmap-weekday-labels > text:nth-child(7)) {
              order: 6;
            }
          `}</style>
          
          <CalendarHeatmap
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            values={aggregatedData}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return 'color-empty';
              }
              
              // Get color class
              const colorClass = getColor(value.count);
              
              // Log for debugging
              console.log(`Date ${value.date}: count=${value.count}, class=${colorClass}`);
              
              return colorClass;
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) {
                return { 'data-tooltip-id': 'heatmap-tooltip' } as Record<string, string>;
              }
              
              // Format date - use local timezone to avoid date offset issues
              let date;
              if (typeof value.date === 'string') {
                // Create date using local timezone
                const [year, month, day] = value.date.split('-').map(Number);
                date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
              } else {
                date = value.date;
              }
              
              // Get day of week
              const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayOfWeek = daysOfWeek[date.getDay()];
              
              // Format date as MM/DD/YYYY
              const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
              
              // We need to cast value to access our custom properties
              const typedValue = value as unknown as AggregatedContribution;
              
              // Format tooltip content with day of week
              let htmlContent = `${dayOfWeek}, ${formattedDate}: ${value.count} contributions`;
              
              // Debug log to check if contributions array exists
              console.log('Tooltip value:', typedValue);
              
              // Check if contributions array exists and has items
              if (typedValue.contributions && typedValue.contributions.length > 0) {
                // Add a line break before listing individual contributions
                htmlContent += '<br/>';
                
                // Group contributions by instance type (GitLab vs GitHub)
                const gitlabContributions: { name: string, count: number }[] = [];
                const githubContributions: { name: string, count: number }[] = [];
                
                typedValue.contributions.forEach((c) => {
                  // Find the instance name - could be GitLab or GitHub
                  
                  // First check GitLab instances
                  const gitlabInstance = gitlabInstances.find(i => i.id === c.instanceId);
                  if (gitlabInstance) {
                    gitlabContributions.push({ name: gitlabInstance.name, count: c.count });
                  } else {
                    // Then check GitHub instances
                    const githubInstance = githubInstances.find(i => i.id === c.instanceId);
                    if (githubInstance) {
                      githubContributions.push({ name: githubInstance.name, count: c.count });
                    }
                  }
                });
                
                // Add GitLab contributions if any
                if (gitlabContributions.length > 0) {
                  htmlContent += '<strong>GitLab:</strong><br/>';
                  gitlabContributions.forEach(c => {
                    htmlContent += `&nbsp;&nbsp;${c.name}: ${c.count}<br/>`;
                  });
                }
                
                // Add GitHub contributions if any
                if (githubContributions.length > 0) {
                  htmlContent += '<strong>GitHub:</strong><br/>';
                  githubContributions.forEach(c => {
                    htmlContent += `&nbsp;&nbsp;${c.name}: ${c.count}<br/>`;
                  });
                }
              }
              
              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-html': htmlContent
              } as Record<string, string>;
            }}
          />
          
          <Tooltip id="heatmap-tooltip" />
          
          <div className="flex justify-end items-center mt-2 text-xs">
            <span className="mr-1">Less</span>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-empty)' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-1)' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-3)' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-6)' }}></div>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-10)' }}></div>
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
} 