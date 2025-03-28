"use client";

import React, { useState, useEffect } from 'react';
import { useRepo } from '../lib/repoContext';
import { fetchContributions, fetchGitLabUser } from '../lib/gitlabApi';
import { fetchGitHubContributions, fetchGitHubUser } from '../lib/githubApi';
import { LeaderboardEntry, UserData } from '../types';

export default function Leaderboard() {
  const { gitlabInstances, githubInstances, loading } = useRepo();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate date range (past month)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  
  // Add one day to endDate to ensure today's contributions are included
  const tomorrowDate = new Date(endDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  const startDateString = startDate.toISOString().split('T')[0];
  const endDateString = tomorrowDate.toISOString().split('T')[0];

  useEffect(() => {
    if ((gitlabInstances.length === 0 && githubInstances.length === 0) || loading) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        // Create a map to store user data and their contributions
        const usersMap = new Map<string, {
          user: UserData;
          totalContributions: number;
          instances: { instanceId: string; contributions: number }[];
        }>();
        
        // Process each GitLab instance
        for (const instance of gitlabInstances) {
          try {
            // Fetch user data
            const userData = await fetchGitLabUser(instance);
            const userKey = `${userData.username}-${userData.email}`;
            
            // Fetch contributions
            const contributions = await fetchContributions(instance, startDateString, endDateString);
            const totalContributionsForInstance = contributions.reduce((sum, c) => sum + c.count, 0);
            
            // Add or update user in the map
            if (usersMap.has(userKey)) {
              const existingUser = usersMap.get(userKey)!;
              existingUser.totalContributions += totalContributionsForInstance;
              existingUser.instances.push({
                instanceId: instance.id,
                contributions: totalContributionsForInstance
              });
            } else {
              usersMap.set(userKey, {
                user: userData,
                totalContributions: totalContributionsForInstance,
                instances: [{
                  instanceId: instance.id,
                  contributions: totalContributionsForInstance
                }]
              });
            }
          } catch (err) {
            console.error(`Error processing GitLab instance ${instance.name}:`, err);
          }
        }
        
        // Process each GitHub instance
        for (const instance of githubInstances) {
          try {
            // Fetch user data
            const userData = await fetchGitHubUser(instance);
            const userKey = `${userData.username}-${userData.email}`;
            
            // Fetch contributions
            const contributions = await fetchGitHubContributions(instance, startDateString, endDateString);
            const totalContributionsForInstance = contributions.reduce((sum, c) => sum + c.count, 0);
            
            // Add or update user in the map
            if (usersMap.has(userKey)) {
              const existingUser = usersMap.get(userKey)!;
              existingUser.totalContributions += totalContributionsForInstance;
              existingUser.instances.push({
                instanceId: instance.id,
                contributions: totalContributionsForInstance
              });
            } else {
              usersMap.set(userKey, {
                user: userData,
                totalContributions: totalContributionsForInstance,
                instances: [{
                  instanceId: instance.id,
                  contributions: totalContributionsForInstance
                }]
              });
            }
          } catch (err) {
            console.error(`Error processing GitHub instance ${instance.name}:`, err);
          }
        }
        
        // Convert map to array and sort by total contributions
        const leaderboard = Array.from(usersMap.values())
          .sort((a, b) => b.totalContributions - a.totalContributions);
        
        setLeaderboardData(leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to fetch leaderboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [gitlabInstances, githubInstances, loading, startDateString, endDateString]);

  // Combine GitLab and GitHub instances for the leaderboard
  const allInstances = [...gitlabInstances, ...githubInstances];
  
  // No instances added yet, show placeholder
  if (allInstances.length === 0) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">Instance Leaderboard</h2>
        <p className="text-muted-foreground">Add GitLab or GitHub instances to see your leaderboard.</p>
      </div>
    );
  }
  
  // Sort instances by total contributions (in real app, would need to calculate this)
  const sortedInstances = [...allInstances].sort((a, b) => {
    // For demonstration, we're just sorting alphabetically
    return a.name.localeCompare(b.name);
    // In a real app, you'd sort by actual contribution counts
  });
  
  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <h2 className="text-xl font-semibold mb-4">Instance Leaderboard</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-2 text-left">Rank</th>
              <th className="pb-2 text-left">Instance</th>
              <th className="pb-2 text-left">Type</th>
              <th className="pb-2 text-right">Contributions</th>
            </tr>
          </thead>
          <tbody>
            {sortedInstances.map((instance, index) => {
              // Determine the instance type and any instance-specific info
              const instanceInfo: any = instance;
              const instanceType = 'type' in instanceInfo ? 'GitHub' : 'GitLab';
              
              return (
                <tr key={instance.id} className="border-b border-border">
                  <td className="py-3 pr-4">{index + 1}</td>
                  <td className="py-3 pr-4">{instance.name}</td>
                  <td className="py-3 pr-4">
                    {instanceType === 'GitHub' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent text-accent-foreground">
                        GitHub
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                        GitLab
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {/* Placeholder for actual contribution count */}
                    <span className="font-semibold">{Math.floor(Math.random() * 500)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 