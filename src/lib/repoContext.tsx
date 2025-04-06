"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GitLabInstance } from '@/types';

interface RepoContextType {
  instances: GitLabInstance[];
  addInstance: (instance: Omit<GitLabInstance, 'id'>) => Promise<void>;
  editInstance: (id: string, instance: Omit<GitLabInstance, 'id'>) => Promise<void>;
  removeInstance: (id: string) => Promise<void>;
  loading: boolean;
}

const RepoContext = createContext<RepoContextType | undefined>(undefined);

export function RepoProvider({ children }: { children: React.ReactNode }) {
  const [instances, setInstances] = useState<GitLabInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstances();
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

  return (
    <RepoContext.Provider value={{ instances, addInstance, editInstance, removeInstance, loading }}>
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