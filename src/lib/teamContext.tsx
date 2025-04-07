"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TeamMember, InstanceUsername } from './types';

interface TeamContextType {
  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTeamMember: (id: string, member: Partial<Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (member: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(member),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add team member');
      }

      const newMember = await response.json();
      setTeamMembers(prev => [...prev, newMember]);
    } catch (error) {
      console.error('Failed to add team member:', error);
      throw error;
    }
  };

  const updateTeamMember = async (id: string, member: Partial<Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const response = await fetch('/api/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          ...member,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update team member');
      }

      const updatedMember = await response.json();
      setTeamMembers(prev =>
        prev.map(m => m.id === id ? updatedMember : m)
      );
    } catch (error) {
      console.error('Failed to update team member:', error);
      throw error;
    }
  };

  const removeTeamMember = async (id: string) => {
    try {
      const response = await fetch('/api/team', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove team member');
      }

      setTeamMembers(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to remove team member:', error);
      throw error;
    }
  };

  return (
    <TeamContext.Provider
      value={{
        teamMembers,
        addTeamMember,
        updateTeamMember,
        removeTeamMember,
        loading,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
} 