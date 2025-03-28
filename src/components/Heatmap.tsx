"use client";

import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useRepo } from '../lib/repoContext';
import { fetchContributions } from '../lib/gitlabApi';
import { fetchGitHubContributions } from '../lib/githubApi';
import { AggregatedContribution } from '../types';

type ReactCalendarHeatmapValue = {
  date: string | Date;
  count?: number;
  [key: string]: any;
};

export default function Heatmap() {
  const { gitlabInstances, githubInstances, loading } = useRepo();
  const [aggregatedData, setAggregatedData] = useState<AggregatedContribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate date range (past year)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  // Add one day to endDate to ensure today's contributions are included
  const tomorrowDate = new Date(endDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const startDateString = startDate.toISOString().split('T')[0];
  const endDateString = tomorrowDate.toISOString().split('T')[0];

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
          startDate: startDateString,
          endDate: endDateString
        });
        
        // Fetch contributions for each GitLab instance
        const gitlabContributionsPromises = gitlabInstances.map(instance => 
          fetchContributions(instance, startDateString, endDateString)
        );
        
        // Fetch contributions for each GitHub instance
        const githubContributionsPromises = githubInstances.map(instance => 
          fetchGitHubContributions(instance, startDateString, endDateString)
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
  }, [gitlabInstances, githubInstances, loading, startDateString, endDateString]);

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
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Contribution Heatmap</h2>
        <p className="text-gray-500">Add GitLab or GitHub instances to see your contribution heatmap.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Contribution Heatmap</h2>
      
      {isLoading && <p className="text-gray-500">Loading heatmap data...</p>}
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="heatmap-container">
          <style jsx>{`
            .color-empty { fill: #ebedf0; }
            .color-scale-1 { fill: #acd5f2; }
            .color-scale-2 { fill: #7fa8c9; }
            .color-scale-3 { fill: #527ba0; }
            .color-scale-4 { fill: #254e77; }
            
            :global(.react-calendar-heatmap) {
              width: 100%;
            }
          `}</style>
          
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
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