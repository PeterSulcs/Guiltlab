"use client";

import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { useSelection } from '@/lib/selectionContext';

interface TeamLeaderboardProps {
  startDate: Date;
  endDate: Date;
}

interface TeamMember {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  contributions: { date: string; count: number }[];
}

export default function TeamLeaderboard({ startDate, endDate }: TeamLeaderboardProps) {
  const { selectedInstanceId, loading: selectionLoading } = useSelection();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedInstanceId) {
        setTeamMembers([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch team members
        const teamResponse = await fetch('/api/gitlab/team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceId: selectedInstanceId,
          }),
        });

        if (!teamResponse.ok) {
          throw new Error('Failed to fetch team data');
        }

        const teamData = await teamResponse.json();

        // Fetch contributions for each team member
        const membersWithContributions = await Promise.all(
          teamData.map(async (member: any) => {
            const eventsResponse = await fetch('/api/gitlab/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instanceId: selectedInstanceId,
                userId: member.id,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
            });

            if (!eventsResponse.ok) {
              throw new Error(`Failed to fetch events for ${member.username}`);
            }

            const events = await eventsResponse.json();

            // Aggregate events by date
            const eventsByDate = events.reduce((acc: { [key: string]: number }, event: any) => {
              const date = new Date(event.created_at).toISOString().split('T')[0];
              acc[date] = (acc[date] || 0) + 1;
              return acc;
            }, {});

            // Convert to CalendarHeatmap format
            const contributions = Object.entries(eventsByDate).map(([date, count]) => ({
              date,
              count: count as number,
            }));

            return {
              ...member,
              contributions,
            };
          })
        );

        setTeamMembers(membersWithContributions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [selectedInstanceId, startDate, endDate]);

  if (selectionLoading || loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  if (!selectedInstanceId) {
    return <div className="text-center text-muted-foreground">Select an instance to view team data</div>;
  }

  return (
    <div className="team-leaderboard">
      <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div key={member.id} className="member-card p-4 bg-card-background rounded-lg shadow">
            <div className="flex items-center mb-4">
              <img
                src={member.avatar_url}
                alt={member.name}
                className="w-12 h-12 rounded-full mr-4"
              />
              <div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-muted-foreground">@{member.username}</p>
              </div>
            </div>
            <div className="heatmap-container mb-4">
              <CalendarHeatmap
                startDate={startDate}
                endDate={endDate}
                values={member.contributions}
                classForValue={(value) => {
                  if (!value) return 'color-empty';
                  return `color-scale-${Math.min(value.count, 4)}`;
                }}
                tooltipDataAttrs={(value) => {
                  if (!value) return { 'aria-label': 'No contributions' };
                  return { 'aria-label': `${value.date}: ${value.count} contributions` };
                }}
                showWeekdayLabels={false}
                titleForValue={(value) => {
                  if (!value) return 'No contributions';
                  return `${value.date}: ${value.count} contributions`;
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Total Contributions: {member.contributions.reduce((sum, c) => sum + c.count, 0)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        .team-leaderboard {
          padding: 1rem;
        }
        .member-card {
          border: 1px solid var(--border);
        }
        .heatmap-container {
          height: 100px;
        }
        :global(.react-calendar-heatmap .color-empty) {
          fill: var(--muted);
        }
        :global(.react-calendar-heatmap .color-scale-1) {
          fill: var(--primary-light);
        }
        :global(.react-calendar-heatmap .color-scale-2) {
          fill: var(--primary);
        }
        :global(.react-calendar-heatmap .color-scale-3) {
          fill: var(--primary-dark);
        }
        :global(.react-calendar-heatmap .color-scale-4) {
          fill: var(--primary-darker);
        }
      `}</style>
    </div>
  );
} 