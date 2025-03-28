"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DateRange {
  startDate: Date;
  endDate: Date;
  startDateString: string;
  endDateString: string;
  label: string;
  value: number;
}

interface DateContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: ReactNode }) {
  // Default to last 12 months
  const today = new Date();
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  
  // Add one day to endDate to ensure today's contributions are included
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: lastYear,
    endDate: today,
    startDateString: lastYear.toISOString().split('T')[0],
    endDateString: tomorrowDate.toISOString().split('T')[0],
    label: 'Last 12 months',
    value: 0
  });

  return (
    <DateContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error('useDateRange must be used within a DateProvider');
  }
  return context;
} 