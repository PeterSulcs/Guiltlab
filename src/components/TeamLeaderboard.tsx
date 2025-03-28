"use client";

import React, { useState, useEffect } from 'react';
import { useTeam } from '../lib/teamContext';
import { useRepo } from '../lib/repoContext';
import { useDateRange } from '../lib/dateContext';
import { fetchContributions } from '../lib/gitlabApi';
import { TeamLeaderboardEntry, TeamMember } from '../types';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useTheme } from '../lib/themeContext';

export default function TeamLeaderboard() {
  const { teamMembers, loading: teamLoading } = useTeam();
  const { gitlabInstances, loading: repoLoading } = useRepo();
  const { dateRange } = useDateRange();
  const { resolvedTheme } = useTheme();
  const [leaderboardData, setLeaderboardData] = useState<TeamLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Skip if there are no team members or GitLab instances
    if (teamLoading || repoLoading || teamMembers.length === 0 || gitlabInstances.length === 0) {
      return;
    }

    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch contributions for each team member across all GitLab instances
        const leaderboardEntries: TeamLeaderboardEntry[] = [];

        // Process each team member
        for (const member of teamMembers) {
          const contributionsByInstance: {
            instanceId: string;
            instanceName: string;
            contributions: number;
          }[] = [];

          const contributionsByDate = new Map<string, number>();
          let totalContributions = 0;

          // Process each GitLab instance
          for (const instance of gitlabInstances) {
            try {
              // Fetch contributions using GitLab username across all instances
              // For simplicity, we're using the member's gitlabUsername directly
              const contributions = await fetchContributions(
                {
                  ...instance,
                  // Don't override with team member's GitLab username here
                },
                dateRange.startDateString,
                dateRange.endDateString,
                member.gitlabUsername  // Pass as an optional parameter to fetchContributions
              );

              // Sum contributions for this instance
              const instanceTotal = contributions.reduce((total, item) => total + item.count, 0);
              
              // Add to instance breakdown
              contributionsByInstance.push({
                instanceId: instance.id,
                instanceName: instance.name,
                contributions: instanceTotal
              });

              // Aggregate contributions by date
              contributions.forEach(contribution => {
                const existingCount = contributionsByDate.get(contribution.date) || 0;
                contributionsByDate.set(contribution.date, existingCount + contribution.count);
              });

              totalContributions += instanceTotal;
            } catch (error) {
              console.error(`Error fetching contributions for ${member.name} on ${instance.name}:`, error);
              // Continue with other instances even if one fails
            }
          }

          // Create leaderboard entry for this member
          leaderboardEntries.push({
            member,
            totalContributions,
            contributionsByInstance,
            contributionsByDate: Array.from(contributionsByDate.entries()).map(([date, count]) => ({
              date,
              count
            }))
          });
        }

        // Sort by total contributions (descending)
        leaderboardEntries.sort((a, b) => b.totalContributions - a.totalContributions);
        
        setLeaderboardData(leaderboardEntries);
      } catch (error) {
        console.error('Error fetching team leaderboard data:', error);
        setError('Failed to fetch team contribution data. Please check your team members and GitLab instances.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [teamMembers, gitlabInstances, dateRange, teamLoading, repoLoading]);

  // Calculate color based on contribution count
  const getColorClass = (count: number) => {
    if (!count) return 'color-empty';
    if (count === 1) return 'color-scale-1';
    if (count <= 3) return 'color-scale-3';
    if (count <= 6) return 'color-scale-6';
    if (count <= 10) return 'color-scale-8';
    return 'color-scale-10';
  };

  if (teamMembers.length === 0) {
    return (
      <div className="bg-card-background rounded-lg shadow border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
        <p className="text-muted-foreground">
          No team members added yet. Add team members to see the leaderboard.
        </p>
      </div>
    );
  }

  if (gitlabInstances.length === 0) {
    return (
      <div className="bg-card-background rounded-lg shadow border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
        <p className="text-muted-foreground">
          No GitLab instances configured. Add GitLab instances to see the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leaderboard Table */}
      <div className="bg-card-background rounded-lg shadow border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Contributions for {dateRange.label}
        </p>

        {isLoading ? (
          <p className="text-muted-foreground">Loading team contributions...</p>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Team Member</th>
                  <th className="px-4 py-2 text-right font-medium">Contributions</th>
                  <th className="px-4 py-2 text-left font-medium">GitLab Instances</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((entry, index) => (
                  <tr 
                    key={entry.member.id}
                    className="border-b border-border hover:bg-background/50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="mr-2 text-muted-foreground">{index + 1}.</span>
                        <span className="font-medium">{entry.member.name}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          @{entry.member.gitlabUsername}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {entry.totalContributions}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {entry.contributionsByInstance.map((instance) => (
                          <div 
                            key={instance.instanceId}
                            className="text-xs bg-background px-2 py-1 rounded"
                            title={`${instance.instanceName}: ${instance.contributions} contributions`}
                          >
                            {instance.instanceName}: {instance.contributions}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Member Heatmaps */}
      {!isLoading && !error && leaderboardData.map((entry) => (
        <div key={entry.member.id} className="bg-card-background rounded-lg shadow border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {entry.member.name}'s Contributions
            </h2>
            <p className="text-sm text-muted-foreground">
              {entry.totalContributions} contributions in {dateRange.label}
            </p>
          </div>

          <div className="heatmap-container">
            <style jsx>{`
              .color-empty { fill: var(--color-empty) !important; }
              .color-scale-1 { fill: var(--color-scale-1) !important; }
              .color-scale-2 { fill: var(--color-scale-2) !important; }
              .color-scale-3 { fill: var(--color-scale-3) !important; }
              .color-scale-4 { fill: var(--color-scale-4) !important; }
              .color-scale-5 { fill: var(--color-scale-5) !important; }
              .color-scale-6 { fill: var(--color-scale-6) !important; }
              .color-scale-7 { fill: var(--color-scale-7) !important; }
              .color-scale-8 { fill: var(--color-scale-8) !important; }
              .color-scale-9 { fill: var(--color-scale-9) !important; }
              .color-scale-10 { fill: var(--color-scale-10) !important; }
              
              /* Override react-calendar-heatmap styles for dark mode */
              :global(.react-calendar-heatmap) {
                width: 100%;
              }
              
              :global(.react-calendar-heatmap text) {
                fill: var(--foreground);
                font-size: 10px;
              }
            `}</style>

            <CalendarHeatmap
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              values={entry.contributionsByDate.map(item => ({
                date: item.date,
                count: item.count
              }))}
              classForValue={(value) => {
                if (!value || value.count === 0) {
                  return 'color-empty';
                }
                return getColorClass(value.count);
              }}
              tooltipDataAttrs={(value) => {
                if (!value || !value.date) {
                  return { 'data-tooltip-id': `team-heatmap-tooltip-${entry.member.id}` } as any;
                }

                const date = new Date(value.date);
                const formattedDate = date.toLocaleDateString();
                
                return {
                  'data-tooltip-id': `team-heatmap-tooltip-${entry.member.id}`,
                  'data-tooltip-content': `${formattedDate}: ${value.count} contributions`,
                } as any;
              }}
            />
            
            <Tooltip id={`team-heatmap-tooltip-${entry.member.id}`} />
            
            <div className="flex justify-end items-center mt-2 text-xs">
              <span className="mr-1">Less</span>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-empty)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-1)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-3)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-6)' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '2px', marginRight: '4px', backgroundColor: 'var(--color-scale-10)' }}></div>
              <span>More</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 