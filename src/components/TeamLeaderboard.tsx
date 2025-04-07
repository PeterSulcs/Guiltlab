"use client";

import React, { useEffect, useState } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import { useSelection } from '@/lib/selectionContext';
import { useTeam } from '@/lib/teamContext';
import { useRepo } from '@/lib/repoContext';

interface TeamLeaderboardProps {
  startDate: Date;
  endDate: Date;
}

interface TeamMemberContributions {
  id: string;
  displayName: string;
  contributions: { date: string; count: number }[];
}

export default function TeamLeaderboard({ startDate, endDate }: TeamLeaderboardProps) {
  const { selectedInstanceId, loading: selectionLoading } = useSelection();
  const { teamMembers, loading: teamLoading } = useTeam();
  const { instances, githubInstances } = useRepo();
  const [memberContributions, setMemberContributions] = useState<TeamMemberContributions[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (teamMembers.length === 0) {
        setMemberContributions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // For each team member, fetch their contributions from all instances
        const membersWithContributions = await Promise.all(
          teamMembers.map(async (member) => {
            let allContributions: { date: string; count: number }[] = [];

            // Log team member and their instance usernames
            console.log('Processing team member:', {
              displayName: member.displayName,
              instanceUsernames: member.instanceUsernames
            });

            // Fetch GitLab events for each GitLab instance
            const gitlabUsernames = member.instanceUsernames.filter(iu => iu.instanceType === 'gitlab');
            console.log('GitLab usernames:', gitlabUsernames);

            for (const instanceUsername of gitlabUsernames) {
              try {
                const eventsResponse = await fetch('/api/gitlab/events', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    instanceId: instanceUsername.instanceId,
                    username: instanceUsername.username,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                  }),
                });

                if (!eventsResponse.ok) {
                  console.error(`Failed to fetch GitLab events for ${member.displayName} on instance ${instanceUsername.instanceId}`);
                  continue;
                }

                const events = await eventsResponse.json();

                // Aggregate events by date
                events.forEach((event: any) => {
                  const date = new Date(event.created_at).toISOString().split('T')[0];
                  const existingContribution = allContributions.find(c => c.date === date);
                  if (existingContribution) {
                    existingContribution.count += 1;
                  } else {
                    allContributions.push({ date, count: 1 });
                  }
                });
              } catch (error) {
                console.error(`Error fetching GitLab events for ${member.displayName}:`, error);
              }
            }

            // Fetch GitHub events for each GitHub instance
            const githubUsernames = member.instanceUsernames.filter(iu => iu.instanceType === 'github');
            console.log('GitHub usernames:', githubUsernames);

            for (const instanceUsername of githubUsernames) {
              try {
                const eventsResponse = await fetch('/api/github/events', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    instanceId: instanceUsername.instanceId,
                    username: instanceUsername.username,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString(),
                  }),
                });

                if (!eventsResponse.ok) {
                  console.error(`Failed to fetch GitHub events for ${member.displayName} on instance ${instanceUsername.instanceId}`);
                  continue;
                }

                const events = await eventsResponse.json();

                // Aggregate events by date
                events.forEach((event: any) => {
                  const date = new Date(event.created_at).toISOString().split('T')[0];
                  const existingContribution = allContributions.find(c => c.date === date);
                  if (existingContribution) {
                    existingContribution.count += 1;
                  } else {
                    allContributions.push({ date, count: 1 });
                  }
                });
              } catch (error) {
                console.error(`Error fetching GitHub events for ${member.displayName}:`, error);
              }
            }

            // Sort contributions by date
            allContributions.sort((a, b) => a.date.localeCompare(b.date));

            return {
              id: member.id,
              displayName: member.displayName,
              contributions: allContributions,
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
  }, [teamMembers, startDate, endDate]);

  if (selectionLoading || teamLoading || loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  if (teamMembers.length === 0) {
    return <div className="text-center text-muted-foreground">Add team members to view their contributions</div>;
  }

  if (instances.length === 0 && githubInstances.length === 0) {
    return <div className="text-center text-muted-foreground">Add GitLab or GitHub instances to view contributions</div>;
  }

  return (
    <div className="team-leaderboard">
      <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
      <div className="grid grid-cols-1 gap-4">
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
                showWeekdayLabels={true}
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
          width: 100%;
        }
        .member-card {
          border: 1px solid var(--border);
          width: 100%;
        }
        .heatmap-container {
          width: 100%;
          overflow: hidden;
        }
        :global(.react-calendar-heatmap) {
          width: 100%;
          height: auto;
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