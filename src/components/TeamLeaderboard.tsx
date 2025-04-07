"use client";

import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { useSelection } from '@/lib/selectionContext';
import { useTeam } from '@/lib/teamContext';

interface TeamLeaderboardProps {
  startDate: Date;
  endDate: Date;
}

interface TeamMemberContributions {
  id: string;
  displayName: string;
  avatarUrl?: string;
  contributions: { date: string; count: number }[];
}

export default function TeamLeaderboard({ startDate, endDate }: TeamLeaderboardProps) {
  const { selectedInstanceId, loading: selectionLoading } = useSelection();
  const { teamMembers, loading: teamLoading } = useTeam();
  const [memberContributions, setMemberContributions] = useState<TeamMemberContributions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!selectedInstanceId || teamMembers.length === 0) {
        setMemberContributions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // For each team member, find their username for the selected instance
        const membersWithContributions = await Promise.all(
          teamMembers.map(async (member) => {
            // Find the username for the selected instance
            const instanceUsername = member.instanceUsernames.find(
              iu => iu.instanceId === selectedInstanceId
            );

            if (!instanceUsername) {
              return {
                id: member.id,
                displayName: member.displayName,
                contributions: []
              };
            }

            // Fetch events for this user
            const eventsResponse = await fetch('/api/gitlab/events', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instanceId: selectedInstanceId,
                username: instanceUsername.username,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
            });

            if (!eventsResponse.ok) {
              throw new Error(`Failed to fetch events for ${member.displayName}`);
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
              id: member.id,
              displayName: member.displayName,
              contributions,
            };
          })
        );

        setMemberContributions(membersWithContributions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [selectedInstanceId, teamMembers, startDate, endDate]);

  if (selectionLoading || teamLoading || loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  if (!selectedInstanceId) {
    return <div className="text-center text-muted-foreground">Select an instance to view team data</div>;
  }

  if (teamMembers.length === 0) {
    return <div className="text-center text-muted-foreground">Add team members to view their contributions</div>;
  }

  return (
    <div className="team-leaderboard">
      <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberContributions.map((member) => (
          <div key={member.id} className="member-card p-4 bg-card-background rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div>
                <h3 className="font-medium">{member.displayName}</h3>
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