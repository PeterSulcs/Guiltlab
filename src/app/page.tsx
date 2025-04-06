import React from 'react';
import Heatmap from '@/components/Heatmap';
import TeamLeaderboard from '@/components/TeamLeaderboard';
import { RepoProvider } from '@/lib/repoContext';
import { SelectionProvider } from '@/lib/selectionContext';

function Dashboard() {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();

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
