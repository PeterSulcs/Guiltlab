"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRepo } from './repoContext';
import { usePathname } from 'next/navigation';

interface SelectionContextType {
  selectedInstanceId: string | null;
  selectedUserId: number | null;
  setSelectedInstanceId: (id: string | null) => void;
  setSelectedUserId: (id: number | null) => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: React.ReactNode }) {
  const { instances, loading: repoLoading } = useRepo();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  // Set default instance when instances are loaded
  useEffect(() => {
    if (!repoLoading && instances.length > 0 && !selectedInstanceId) {
      setSelectedInstanceId(instances[0].id);
    }
  }, [instances, repoLoading, selectedInstanceId]);

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Fetch user data when instance is selected
  useEffect(() => {
    const fetchUserData = async () => {
      // Skip fetching user data on the settings page
      if (pathname === '/settings') {
        setLoading(false);
        return;
      }

      if (!selectedInstanceId) {
        setSelectedUserId(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user data');
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
  }, [selectedInstanceId, pathname]);

  return (
    <SelectionContext.Provider
      value={{
        selectedInstanceId,
        selectedUserId,
        setSelectedInstanceId,
        setSelectedUserId,
        loading,
        error,
        clearError,
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