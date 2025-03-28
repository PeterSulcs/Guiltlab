"use client";

import React from 'react';
import { useTheme } from '../lib/themeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="fixed bottom-5 right-5 flex items-center bg-card-background border border-border rounded-lg shadow p-2 z-50">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-l-md ${
          theme === 'light' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
        aria-label="Light mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 ${
          theme === 'system' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
        aria-label="System theme"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-r-md ${
          theme === 'dark' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        }`}
        aria-label="Dark mode"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      </button>
    </div>
  );
} 