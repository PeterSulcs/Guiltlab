"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { TeamMember } from '../types';

interface TeamContextType {
  teamMembers: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id' | 'addedAt'>) => void;
  updateTeamMember: (id: string, member: Partial<Omit<TeamMember, 'id' | 'addedAt'>>) => void;
  removeTeamMember: (id: string) => void;
  loading: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error('useTeam must be used within a TeamProvider');
  }
  return context;
}

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Load team members from localStorage on mount
  useEffect(() => {
    const storedTeamMembers = localStorage.getItem('teamMembers');
    if (storedTeamMembers) {
      try {
        setTeamMembers(JSON.parse(storedTeamMembers));
      } catch (error) {
        console.error('Failed to parse team members from localStorage:', error);
      }
    }
    setLoading(false);
  }, []);

  // Save team members to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
    }
  }, [teamMembers, loading]);

  // Add a new team member
  const addTeamMember = (member: Omit<TeamMember, 'id' | 'addedAt'>) => {
    const newMember: TeamMember = {
      ...member,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString()
    };
    setTeamMembers(prevMembers => [...prevMembers, newMember]);
  };

  // Update an existing team member
  const updateTeamMember = (id: string, member: Partial<Omit<TeamMember, 'id' | 'addedAt'>>) => {
    setTeamMembers(prevMembers => 
      prevMembers.map(m => 
        m.id === id ? { ...m, ...member } : m
      )
    );
  };

  // Remove a team member
  const removeTeamMember = (id: string) => {
    setTeamMembers(prevMembers => prevMembers.filter(m => m.id !== id));
  };

  return (
    <TeamContext.Provider value={{
      teamMembers,
      addTeamMember,
      updateTeamMember,
      removeTeamMember,
      loading
    }}>
      {children}
    </TeamContext.Provider>
  );
} 