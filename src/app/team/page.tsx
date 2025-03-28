"use client";

import React, { useState } from 'react';
import TeamMemberForm from '@/components/TeamMemberForm';
import TeamMemberList from '@/components/TeamMemberList';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import { useTeam } from '@/lib/teamContext';

export default function TeamPage() {
  const { teamMembers } = useTeam();
  const [activeTab, setActiveTab] = useState<'members' | 'leaderboard'>(
    teamMembers.length === 0 ? 'members' : 'leaderboard'
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Team</h1>
        <p className="text-muted-foreground mt-2">
          Track and compare contributions across your team
        </p>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-border mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'leaderboard'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'members'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Manage Members
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'members' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <TeamMemberForm />
          </div>
          <div className="space-y-6">
            <TeamMemberList />
          </div>
        </div>
      ) : (
        <TeamLeaderboard />
      )}
    </div>
  );
} 