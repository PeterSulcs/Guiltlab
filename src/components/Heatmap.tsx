"use client";

import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useGitLab } from '../lib/gitlabContext';
import { fetchContributions, aggregateContributions } from '../lib/gitlabApi';
import { AggregatedContribution } from '../types';

type ReactCalendarHeatmapValue = {
  date: string | Date;
  count?: number;
  [key: string]: any;
};

export default function Heatmap() {
  const { instances, loading } = useGitLab();
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

  useEffect(() => {
    if (instances.length === 0 || loading) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        console.log("Fetching data with date range:", {
          startDate: startDateString,
          endDate: endDateString
        });
        
        // Fetch contributions for each instance
        const contributionsPromises = instances.map(instance => 
          fetchContributions(instance, startDateString, endDateString)
        );
        
        const contributionsResults = await Promise.all(contributionsPromises);
        
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
        setError('Failed to fetch contribution data. Please check your GitLab instances and try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [instances, loading, startDateString, endDateString]);

  // Calculate color based on count
  const getColor = (count: number) => {
    if (count === 0) return 'color-empty';
    if (count < 2) return 'color-scale-1';
    if (count < 4) return 'color-scale-2';
    if (count < 8) return 'color-scale-3';
    return 'color-scale-4';
  };

  if (instances.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Contribution Heatmap</h2>
        <p className="text-gray-500">Add GitLab instances to see your contribution heatmap.</p>
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
                  const instance = instances.find(i => i.id === c.instanceId);
                  htmlContent += `<br/>${instance?.name || 'Unknown'}: ${c.count}`;
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