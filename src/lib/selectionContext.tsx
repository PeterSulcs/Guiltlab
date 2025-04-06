"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRepo } from './repoContext';

interface SelectionContextType {
  selectedInstanceId: string | null;
  selectedUserId: number | null;
  setSelectedInstanceId: (id: string | null) => void;
  setSelectedUserId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { instances, loading: repoLoading } = useRepo();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set default instance when instances are loaded
  useEffect(() => {
    if (!repoLoading && instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, repoLoading, selectedInstanceId]);

  // Fetch user data when instance is selected
  useEffect(() => {
    const fetchUserData = async () => {
      if (!selectedInstanceId) {
        setSelectedUserId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/gitlab/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceId: selectedInstanceId,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setSelectedUserId(userData.id);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user data');
        setSelectedUserId(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [selectedInstanceId]);

  return (
    <SelectionContext.Provider
      value={{
        selectedInstanceId,
        selectedUserId,
        setSelectedInstanceId,
        setSelectedUserId,
        loading,
        error,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
} 