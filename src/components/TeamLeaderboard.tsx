"use client";

import React, { useState, useEffect } from 'react';
import { useTeam } from '../lib/teamContext';
import { useRepo } from '../lib/repoContext';
import { useDateRange } from '../lib/dateContext';
import { fetchContributions } from '../lib/gitlabApi';
import { fetchGitHubContributions } from '../lib/githubApi';
import { TeamLeaderboardEntry } from '../types';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import axios from 'axios';

export default function TeamLeaderboard() {
  const { teamMembers, loading: teamLoading } = useTeam();
  const { gitlabInstances, githubInstances, loading: repoLoading } = useRepo();
  const { dateRange } = useDateRange();
  const [leaderboardData, setLeaderboardData] = useState<TeamLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Skip if there are no team members or instances
    if (teamLoading || repoLoading || teamMembers.length === 0 || 
        (gitlabInstances.length === 0 && githubInstances.length === 0)) {
      return;
    }

    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      setError('');

      try {
        // Fetch contributions for each team member across all instances
        const leaderboardEntries: TeamLeaderboardEntry[] = [];

        // Process each team member
        for (const member of teamMembers) {
          const contributionsByInstance: {
            instanceId: string;
            instanceName: string;
            contributions: number;
          }[] = [];

          // Track contributions by date AND instance
          const contributionsByDate = new Map<string, {
            total: number,
            byInstance: {
              instanceId: string;
              instanceName: string;
              count: number;
            }[];
          }>();
          
          let totalContributions = 0;

          // Process each GitLab instance
          for (const instance of gitlabInstances) {
            try {
              const instanceUsername = member.instanceUsernames?.find(
                iu => iu.instanceId === instance.id && iu.instanceType === 'gitlab'
              );
              
              if (!instanceUsername) {
                console.log(`No GitLab username defined for ${member.displayName} on ${instance.name}`);
                continue;
              }

              const contributions = await fetchContributions(
                instance,
                instanceUsername.username,
                dateRange.startDateString,
                dateRange.endDateString
              );

              // Process contributions with instance information
              contributions.forEach(contribution => {
                const date = contribution.date;
                const count = contribution.count;
                
                const existingDate = contributionsByDate.get(date) || { total: 0, byInstance: [] };
                existingDate.total += count;
                existingDate.byInstance.push({
                  instanceId: instance.id,
                  instanceName: instance.name,
                  count: count
                });
                
                contributionsByDate.set(date, existingDate);
                totalContributions += count;
              });

              // Sum contributions for this instance
              const instanceTotal = contributions.reduce((total: number, item: { count: number }) => {
                return total + item.count;
              }, 0);
              
              if (instanceTotal > 0) {
                contributionsByInstance.push({
                  instanceId: instance.id,
                  instanceName: instance.name,
                  contributions: instanceTotal
                });
              }
            } catch (error) {
              console.error(`Error fetching GitLab contributions for ${member.displayName} on ${instance.name}:`, error);
            }
          }

          // Process each GitHub instance
          for (const instance of githubInstances) {
            try {
              const instanceUsername = member.instanceUsernames?.find(
                iu => iu.instanceId === instance.id && iu.instanceType === 'github'
              );
              
              if (!instanceUsername) {
                console.log(`No GitHub username defined for ${member.displayName} on ${instance.name}`);
                continue;
              }

              type Contribution = {
                date: string;
                count: number;
                instanceId: string;
              };

              const contributions = await fetchGitHubContributions(
                instance,
                dateRange.startDateString,
                dateRange.endDateString,
                instanceUsername.username
              );

              // Process contributions with instance information
              contributions.forEach((contribution: unknown) => {
                const typedContribution = contribution as Contribution;
                const date = typedContribution.date;
                const count = typedContribution.count;
                
                const existingDate = contributionsByDate.get(date) || { total: 0, byInstance: [] };
                existingDate.total += count;
                existingDate.byInstance.push({
                  instanceId: instance.id,
                  instanceName: instance.name,
                  count: count
                });
                
                contributionsByDate.set(date, existingDate);
                totalContributions += count;
              });

              // Sum contributions for this instance
              const instanceTotal = contributions.reduce((total: number, item: unknown) => {
                const typedItem = item as Contribution;
                return total + typedItem.count;
              }, 0);
              
              if (instanceTotal > 0) {
                contributionsByInstance.push({
                  instanceId: instance.id,
                  instanceName: instance.name,
                  contributions: instanceTotal
                });
              }
            } catch (error) {
              console.error(`Error fetching GitHub contributions for ${member.displayName} on ${instance.name}:`, error);
            }
          }

          // Create leaderboard entry for this member with enhanced data structure
          leaderboardEntries.push({
            member,
            totalContributions,
            contributionsByInstance,
            contributionsByDate: Array.from(contributionsByDate.entries()).map(([date, data]) => ({
              date,
              count: data.total,
              byInstance: data.byInstance
            }))
          });
        }

        // Sort by total contributions (descending)
        leaderboardEntries.sort((a, b) => b.totalContributions - a.totalContributions);
        
        setLeaderboardData(leaderboardEntries);
      } catch (error) {
        console.error('Error fetching team leaderboard data:', error);
        setError('Failed to fetch team contribution data. Please check your team members and instance configurations.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [teamMembers, gitlabInstances, githubInstances, dateRange, teamLoading, repoLoading]);

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

  if (gitlabInstances.length === 0 && githubInstances.length === 0) {
    return (
      <div className="bg-card-background rounded-lg shadow border border-border p-6">
        <h2 className="text-xl font-semibold mb-4">Team Leaderboard</h2>
        <p className="text-muted-foreground">
          No GitLab or GitHub instances configured. Add instances to see the leaderboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="bg-card-background rounded-lg shadow border border-border p-6">
          <div className="flex items-center mb-4">
            <div className="spinner"></div>
            <span className="text-muted-foreground">Loading team contributions...</span>
          </div>
          <div className="animate-pulse space-y-4">
            {/* Simulate team member skeletons */}
            {[1, 2, 3].map(index => (
              <div key={index} className="bg-background rounded-md p-6 border border-border">
                <div className="flex justify-between mb-4">
                  <div className="flex items-center">
                    <div className="skeleton w-8 h-8 rounded-full mr-3"></div>
                    <div className="space-y-2">
                      <div className="skeleton h-4 w-32"></div>
                      <div className="skeleton h-3 w-24"></div>
                    </div>
                  </div>
                  <div className="skeleton h-4 w-16"></div>
                </div>
                <div className="skeleton h-20 w-full animate-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-card-background rounded-lg shadow border border-border p-6">
          <div className="bg-destructive/10 text-destructive p-3 rounded-md">
            {error}
          </div>
        </div>
      ) : (
        // Individual Member Heatmaps - sorted by total contributions
        leaderboardData.map((entry, index) => (
          <div key={entry.member.id} className="bg-card-background rounded-lg shadow border border-border p-6">
            <div className="flex flex-wrap items-center justify-between mb-4">
              <div>
                <div className="flex items-center">
                  <span className="mr-2 text-muted-foreground text-lg font-semibold">{index + 1}.</span>
                  <h2 className="text-xl font-semibold">
                    {entry.member.displayName}
                  </h2>
                  <span className="ml-2 text-sm text-muted-foreground">
                    @{entry.member.username}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entry.contributionsByInstance.map((instance) => (
                    <div 
                      key={instance.instanceId}
                      className="text-xs bg-background px-2 py-1 rounded"
                    >
                      {instance.instanceName}: {instance.contributions}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm font-medium mt-2 md:mt-0">
                <span className="font-bold text-lg">{entry.totalContributions}</span> contributions in {dateRange.label}
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
                  count: item.count,
                  byInstance: item.byInstance
                }))}
                classForValue={(value) => {
                  if (!value || value.count === 0) {
                    return 'color-empty';
                  }
                  return getColorClass(value.count);
                }}
                tooltipDataAttrs={(value) => {
                  if (!value || !value.date) {
                    return { 'data-tooltip-id': `team-heatmap-tooltip-${entry.member.id}` } as Record<string, string>;
                  }

                  // Format date - use local timezone to avoid date offset issues
                  let date;
                  if (typeof value.date === 'string') {
                    // Create date using local timezone
                    const [year, month, day] = value.date.split('-').map(Number);
                    date = new Date(year, month - 1, day); // month is 0-indexed in JS Date
                  } else {
                    date = value.date;
                  }

                  // Get day of week
                  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const dayOfWeek = daysOfWeek[date.getDay()];

                  // Format date as MM/DD/YYYY
                  const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

                  // Format tooltip content with day of week
                  let htmlContent = `${dayOfWeek}, ${formattedDate}: ${value.count} contributions`;

                  // Group contributions by type using the actual per-instance data
                  const typedValue = value as any;
                  if (typedValue.byInstance && typedValue.byInstance.length > 0) {
                    const gitlabContributions = typedValue.byInstance.filter(
                      (c: any) => gitlabInstances.find(i => i.id === c.instanceId)
                    );
                    const githubContributions = typedValue.byInstance.filter(
                      (c: any) => githubInstances.find(i => i.id === c.instanceId)
                    );

                    // Add instance breakdowns if there are any
                    htmlContent += '<br/>';

                    // Add GitLab contributions if any
                    if (gitlabContributions.length > 0) {
                      htmlContent += '<strong>GitLab:</strong><br/>';
                      gitlabContributions.forEach((c: any) => {
                        htmlContent += `&nbsp;&nbsp;${c.instanceName}: ${c.count}<br/>`;
                      });
                    }

                    // Add GitHub contributions if any
                    if (githubContributions.length > 0) {
                      htmlContent += '<strong>GitHub:</strong><br/>';
                      githubContributions.forEach((c: any) => {
                        htmlContent += `&nbsp;&nbsp;${c.instanceName}: ${c.count}<br/>`;
                      });
                    }
                  }

                  return {
                    'data-tooltip-id': `team-heatmap-tooltip-${entry.member.id}`,
                    'data-tooltip-html': htmlContent,
                  } as Record<string, string>;
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
        ))
      )}
    </div>
  );
} 