"use client";

import React, { useState } from 'react';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import { useDateRange } from '@/lib/dateContext';

export default function TeamPage() {
  const { dateRange, setDateRange } = useDateRange();
  
  // Generate year options (current year and previous years)
  const currentYear = new Date().getFullYear();
  const generateYearOptions = () => {
    const options = [];
    
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-end mb-8">
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

      <TeamLeaderboard />
    </div>
  );
} 