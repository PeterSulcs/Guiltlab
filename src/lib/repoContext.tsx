"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GitLabInstance, GitHubInstance } from '@/types';

interface RepoContextType {
  instances: GitLabInstance[];
  githubInstances: GitHubInstance[];
  addInstance: (instance: Omit<GitLabInstance, 'id'>) => Promise<void>;
  editInstance: (id: string, instance: Omit<GitLabInstance, 'id'>) => Promise<void>;
  removeInstance: (id: string) => Promise<void>;
  addGitHubInstance: (instance: GitHubInstance) => Promise<void>;
  editGitHubInstance: (id: string, instance: Omit<GitHubInstance, 'id'>) => Promise<void>;
  removeGitHubInstance: (id: string) => Promise<void>;
  loading: boolean;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<GitLabInstance[]>([]);
  const [githubInstances, setGitHubInstances] = useState<GitHubInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstances();
    loadGitHubInstances();
  }, []);

  const loadInstances = async () => {
    try {
      const response = await fetch('/api/instances');
      if (!response.ok) throw new Error('Failed to load instances');
      const data = await response.json();
      setInstances(data);
    } catch (error) {
      console.error('Error loading instances:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGitHubInstances = async () => {
    try {
      // For now, we'll use localStorage to store GitHub instances
      // In a real app, you would fetch these from an API
      const storedInstances = localStorage.getItem('githubInstances');
      if (storedInstances) {
        setGitHubInstances(JSON.parse(storedInstances));
      }
    } catch (error) {
      console.error('Error loading GitHub instances:', error);
    }
  };

  const addInstance = async (instance: Omit<GitLabInstance, 'id'>) => {
    try {
      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instance),
      });
      if (!response.ok) throw new Error('Failed to add instance');
      const newInstance = await response.json();
      setInstances(prev => [...prev, newInstance]);
    } catch (error) {
      console.error('Error adding instance:', error);
      throw error;
    }
  };

  const editInstance = async (id: string, instance: Omit<GitLabInstance, 'id'>) => {
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instance),
      });
      if (!response.ok) throw new Error('Failed to edit instance');
      const updatedInstance = await response.json();
      setInstances(prev => prev.map(inst => inst.id === id ? updatedInstance : inst));
    } catch (error) {
      console.error('Error editing instance:', error);
      throw error;
    }
  };

  const removeInstance = async (id: string) => {
    try {
      const response = await fetch(`/api/instances/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove instance');
      setInstances(prev => prev.filter(inst => inst.id !== id));
    } catch (error) {
      console.error('Error removing instance:', error);
      throw error;
    }
  };

  const addGitHubInstance = async (instance: GitHubInstance) => {
    try {
      // For now, we'll use localStorage to store GitHub instances
      // In a real app, you would send this to an API
      const updatedInstances = [...githubInstances, instance];
      setGitHubInstances(updatedInstances);
      localStorage.setItem('githubInstances', JSON.stringify(updatedInstances));
    } catch (error) {
      console.error('Error adding GitHub instance:', error);
      throw error;
    }
  };

  const editGitHubInstance = async (id: string, instance: Omit<GitHubInstance, 'id'>) => {
    try {
      // For now, we'll use localStorage to store GitHub instances
      // In a real app, you would send this to an API
      const updatedInstances = githubInstances.map(inst => 
        inst.id === id ? { ...inst, ...instance } : inst
      );
      setGitHubInstances(updatedInstances);
      localStorage.setItem('githubInstances', JSON.stringify(updatedInstances));
    } catch (error) {
      console.error('Error editing GitHub instance:', error);
      throw error;
    }
  };

  const removeGitHubInstance = async (id: string) => {
    try {
      // For now, we'll use localStorage to store GitHub instances
      // In a real app, you would send this to an API
      const updatedInstances = githubInstances.filter(inst => inst.id !== id);
      setGitHubInstances(updatedInstances);
      localStorage.setItem('githubInstances', JSON.stringify(updatedInstances));
    } catch (error) {
      console.error('Error removing GitHub instance:', error);
      throw error;
    }
  };

  return (
    <RepoContext.Provider value={{ 
      instances, 
      githubInstances,
      addInstance, 
      editInstance, 
      removeInstance,
      addGitHubInstance,
      editGitHubInstance,
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