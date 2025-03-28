"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const pathname = usePathname();
  
  // Improved active link styling
  const getLinkStyle = (path: string) => {
    // Check if the current path starts with the given path (for nested routes)
    const isActive = pathname === path || 
      (path !== '/' && pathname.startsWith(path));
    
    return isActive
      ? 'bg-primary-foreground/20 text-primary-foreground border-b-2 border-primary-foreground'
      : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10';
  };
  
  return (
    <header className="bg-primary text-primary-foreground py-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between px-4">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold">
            GuiltLab
          </Link>
          <p className="hidden md:block ml-3 opacity-80">
            Aggregate your GitLab and GitHub contributions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="flex items-center space-x-2 mr-2">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${getLinkStyle('/')}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/team" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${getLinkStyle('/team')}`}
            >
              Team
            </Link>
            <Link 
              href="/settings" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${getLinkStyle('/settings')}`}
            >
              Settings
            </Link>
          </nav>
          
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
} 