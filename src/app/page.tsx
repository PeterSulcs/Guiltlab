"use client";

import React from 'react';
import Heatmap from '@/components/Heatmap';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import { RepoProvider } from '@/lib/repoContext';
import { SelectionProvider } from '@/lib/selectionContext';
import { useSelection } from '@/lib/selectionContext';

function Dashboard() {
  const { selectedInstanceId, selectedUserId, loading, error } = useSelection();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">GitLab Contribution Tracker</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">GitLab Contribution Tracker</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error: {error}</p>
          <p className="text-sm mt-1">
            Please check your GitLab instance configuration in the settings.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedInstanceId || !selectedUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">GitLab Contribution Tracker</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Please add a GitLab instance in the settings to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">GitLab Contribution Tracker</h1>
      
      <div className="space-y-8">
        <section>
          <Heatmap startDate={startDate} endDate={endDate} />
        </section>

        <section>
          <TeamLeaderboard startDate={startDate} endDate={endDate} />
        </section>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <RepoProvider>
      <SelectionProvider>
        <Dashboard />
      </SelectionProvider>
    </RepoProvider>
  );
}
