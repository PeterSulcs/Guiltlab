"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../lib/themeContext';

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme(); 
  
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setCollapsed(savedState === 'true');
    }
  }, []);
  
  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  // Toggle theme handler
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };
  
  // Improved active link styling
  const getLinkStyle = (path: string) => {
    // Check if the current path starts with the given path (for nested routes)
    const isActive = pathname === path || 
      (path !== '/' && pathname.startsWith(path));
    
    return `${collapsed ? 'justify-center' : ''} ${
      isActive
        ? `bg-primary/20 text-foreground ${collapsed ? '' : 'border-r-2 border-primary'} font-medium`
        : 'text-muted-foreground hover:text-foreground hover:bg-primary/10'
    }`;
  };
  
  return (
    <div className={`${collapsed ? 'w-16' : 'w-56'} bg-card-background border-r border-border flex flex-col h-screen sticky top-0 transition-all duration-300`}>
      <div className={`p-4 border-b border-border flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
        {!collapsed && (
          <Link href="/" className="text-xl font-bold">
            GuiltLab
          </Link>
        )}
        
        <button 
          onClick={toggleCollapsed}
          className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>
      
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          <li>
            <Link 
              href="/" 
              className={`px-4 py-2 flex items-center ${getLinkStyle('/')}`}
              title="Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              {!collapsed && <span className="ml-2">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/team" 
              className={`px-4 py-2 flex items-center ${getLinkStyle('/team')}`}
              title="Team"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              {!collapsed && <span className="ml-2">Team</span>}
            </Link>
          </li>
          <li>
            <Link 
              href="/settings" 
              className={`px-4 py-2 flex items-center ${getLinkStyle('/settings')}`}
              title="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {!collapsed && <span className="ml-2">Settings</span>}
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* Theme toggle at the bottom */}
      <div className="p-4 border-t border-border">
        <button
          onClick={toggleTheme}
          className={`w-full p-2 flex items-center ${collapsed ? 'justify-center' : ''} rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground`}
          title={resolvedTheme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
          {!collapsed && <span className="ml-2">Toggle theme</span>}
        </button>
      </div>
    </div>
  );
} 