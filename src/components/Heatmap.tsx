"use client";

import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useRepo } from '../lib/repoContext';
import { fetchContributions } from '../lib/gitlabApi';
import { fetchGitHubContributions } from '../lib/githubApi';
import { AggregatedContribution } from '../types';
import { useTheme } from '../lib/themeContext';
import { useDateRange } from '../lib/dateContext';

type ReactCalendarHeatmapValue = {
  date: string | Date;
  count?: number;
  [key: string]: any;
};

type YearOption = {
  label: string;
  value: number;
  startDate: Date;
  endDate: Date;
};

export default function Heatmap() {
  const { gitlabInstances, githubInstances, loading } = useRepo();
  const { resolvedTheme } = useTheme();
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
    
    // Add specific calendar years (going back 5 years)
    for (let year = currentYear; year >= currentYear - 5; year--) {
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
    contributionsArray: any[][]
  ): Map<string, { count: number, contributions: { instanceId: string, count: number }[] }> => {
    const aggregatedMap = new Map<string, { 
      count: number, 
      contributions: { instanceId: string, count: number }[] 
    }>();
    
    contributionsArray.flat().forEach(contribution => {
      const existing = aggregatedMap.get(contribution.date);
      
      if (existing) {
        existing.count += contribution.count;
        existing.contributions.push({
          instanceId: contribution.instanceId,
          count: contribution.count
        });
      } else {
        aggregatedMap.set(contribution.date, {
          count: contribution.count,
          contributions: [{
            instanceId: contribution.instanceId,
            count: contribution.count
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
        const gitlabContributionsPromises = gitlabInstances.map(instance => 
          fetchContributions(instance, dateRange.startDateString, dateRange.endDateString)
        );
        
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

  // Calculate color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'color-empty';
    if (count < 2) return 'color-scale-1';
    if (count < 4) return 'color-scale-2';
    if (count < 8) return 'color-scale-3';
    return 'color-scale-4';
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
              }
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
      
      {isLoading && <p className="text-muted-foreground">Loading heatmap data...</p>}
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="heatmap-container">
          <style jsx>{`
            .color-empty { fill: var(--color-empty); }
            .color-scale-1 { fill: var(--color-scale-1); }
            .color-scale-2 { fill: var(--color-scale-2); }
            .color-scale-3 { fill: var(--color-scale-3); }
            .color-scale-4 { fill: var(--color-scale-4); }
            
            /* Override react-calendar-heatmap styles for dark mode */
            :global(.react-calendar-heatmap) {
              width: 100%;
            }
            
            :global(.react-calendar-heatmap text) {
              fill: var(--foreground);
              font-size: 10px;
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
              return getColor(value.count);
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) {
                return { 'data-tooltip-id': 'heatmap-tooltip' } as any;
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
              
              const formattedDate = date.toLocaleDateString();
              
              // We need to cast value to access our custom properties
              const typedValue = value as unknown as AggregatedContribution;
              
              // Format tooltip content
              let htmlContent = `${formattedDate}: ${value.count} contributions`;
              
              if (typedValue.contributions) {
                typedValue.contributions.forEach((c) => {
                  // Find the instance name - could be GitLab or GitHub
                  let instanceName = 'Unknown';
                  
                  // First check GitLab instances
                  const gitlabInstance = gitlabInstances.find(i => i.id === c.instanceId);
                  if (gitlabInstance) {
                    instanceName = gitlabInstance.name;
                  } else {
                    // Then check GitHub instances
                    const githubInstance = githubInstances.find(i => i.id === c.instanceId);
                    if (githubInstance) {
                      instanceName = githubInstance.name;
                    }
                  }
                  
                  htmlContent += `<br/>${instanceName}: ${c.count}`;
                });
              }
              
              return {
                'data-tooltip-id': 'heatmap-tooltip',
                'data-tooltip-html': htmlContent
              } as any;
            }}
          />
          
          <Tooltip id="heatmap-tooltip" />
          
          <div className="flex justify-end items-center mt-2 text-xs">
            <span className="mr-1">Less</span>
            <div className="w-3 h-3 rounded-sm color-empty mr-1"></div>
            <div className="w-3 h-3 rounded-sm color-scale-1 mr-1"></div>
            <div className="w-3 h-3 rounded-sm color-scale-2 mr-1"></div>
            <div className="w-3 h-3 rounded-sm color-scale-3 mr-1"></div>
            <div className="w-3 h-3 rounded-sm color-scale-4 mr-1"></div>
            <span>More</span>
          </div>
        </div>
      )}
    </div>
  );
} 