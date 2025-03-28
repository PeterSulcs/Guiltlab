"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GitLabInstance, GitHubInstance,  } from '../types';

interface RepoContextType {
  gitlabInstances: GitLabInstance[];
  githubInstances: GitHubInstance[];
  addGitLabInstance: (instance: GitLabInstance) => void;
  addGitHubInstance: (instance: GitHubInstance) => void;
  editGitLabInstance: (id: string, updatedInstance: Partial<GitLabInstance>) => void;
  editGitHubInstance: (id: string, updatedInstance: Partial<GitHubInstance>) => void;
  removeGitLabInstance: (id: string) => void;
  removeGitHubInstance: (id: string) => void;
  loading: boolean;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export function RepoProvider({ children }: { children: ReactNode }) {
  const [gitlabInstances, setGitLabInstances] = useState<GitLabInstance[]>([]);
  const [githubInstances, setGitHubInstances] = useState<GitHubInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load instances from localStorage on component mount
    const loadInstances = () => {
      const savedGitLabInstances = localStorage.getItem('gitlabInstances');
      if (savedGitLabInstances) {
        setGitLabInstances(JSON.parse(savedGitLabInstances));
      }
      
      const savedGitHubInstances = localStorage.getItem('githubInstances');
      if (savedGitHubInstances) {
        setGitHubInstances(JSON.parse(savedGitHubInstances));
      }
      
      setLoading(false);
    };

    loadInstances();
  }, []);

  // Update localStorage when instances change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('gitlabInstances', JSON.stringify(gitlabInstances));
    }
  }, [gitlabInstances, loading]);
  
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('githubInstances', JSON.stringify(githubInstances));
    }
  }, [githubInstances, loading]);

  const addGitLabInstance = (instance: GitLabInstance) => {
    setGitLabInstances(prev => [...prev, instance]);
  };
  
  const addGitHubInstance = (instance: GitHubInstance) => {
    setGitHubInstances(prev => [...prev, instance]);
  };

  const editGitLabInstance = (id: string, updatedInstance: Partial<GitLabInstance>) => {
    setGitLabInstances(prev => 
      prev.map(instance => 
        instance.id === id 
          ? { ...instance, ...updatedInstance } 
          : instance
      )
    );
  };
  
  const editGitHubInstance = (id: string, updatedInstance: Partial<GitHubInstance>) => {
    setGitHubInstances(prev => 
      prev.map(instance => 
        instance.id === id 
          ? { ...instance, ...updatedInstance } 
          : instance
      )
    );
  };

  const removeGitLabInstance = (id: string) => {
    setGitLabInstances(prev => prev.filter(instance => instance.id !== id));
  };
  
  const removeGitHubInstance = (id: string) => {
    setGitHubInstances(prev => prev.filter(instance => instance.id !== id));
  };

  return (
    <RepoContext.Provider value={{ 
      gitlabInstances, 
      githubInstances,
      addGitLabInstance, 
      addGitHubInstance,
      editGitLabInstance, 
      editGitHubInstance,
      removeGitLabInstance, 
      removeGitHubInstance,
      loading 
    }}>
      {children}
    </RepoContext.Provider>
  );
}

export function useRepo() {
  const context = useContext(RepoContext);
  if (context === undefined) {
    throw new Error('useRepo must be used within a RepoProvider');
  }
  return context;
} 