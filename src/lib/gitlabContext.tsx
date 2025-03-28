"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitLabInstance } from '../types';

interface GitLabContextType {
  instances: GitLabInstance[];
  addInstance: (instance: GitLabInstance) => void;
  editInstance: (id: string, updatedInstance: Partial<GitLabInstance>) => void;
  removeInstance: (id: string) => void;
  loading: boolean;
}

const GitLabContext = createContext<GitLabContextType | undefined>(undefined);

export function GitLabProvider({ children }: { children: ReactNode }) {
  const [instances, setInstances] = useState<GitLabInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load instances from localStorage on component mount
    const loadInstances = () => {
      const savedInstances = localStorage.getItem('gitlabInstances');
      if (savedInstances) {
        setInstances(JSON.parse(savedInstances));
      }
      setLoading(false);
    };

    loadInstances();
  }, []);

  // Update localStorage when instances change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gitlabInstances', JSON.stringify(instances));
    }
  }, [instances, loading]);

  const addInstance = (instance: GitLabInstance) => {
    setInstances(prev => [...prev, instance]);
  };

  const editInstance = (id: string, updatedInstance: Partial<GitLabInstance>) => {
    setInstances(prev => 
      prev.map(instance => 
        instance.id === id 
          ? { ...instance, ...updatedInstance } 
          : instance
      )
    );
  };

  const removeInstance = (id: string) => {
    setInstances(prev => prev.filter(instance => instance.id !== id));
  };

  return (
    <GitLabContext.Provider value={{ instances, addInstance, editInstance, removeInstance, loading }}>
      {children}
    </GitLabContext.Provider>
  );
}

export function useGitLab() {
  const context = useContext(GitLabContext);
  if (context === undefined) {
    throw new Error('useGitLab must be used within a GitLabProvider');
  }
  return context;
} 