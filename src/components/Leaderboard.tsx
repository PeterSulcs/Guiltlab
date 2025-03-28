"use client";

import React, { useState, useEffect } from 'react';
import { useRepo } from '../lib/repoContext';
import { useDateRange } from '../lib/dateContext';
import { fetchContributions, fetchGitLabUser } from '../lib/gitlabApi';
import { fetchGitHubContributions, fetchGitHubUser } from '../lib/githubApi';
import { UserData } from '../types';

export default function Leaderboard() {
  const { gitlabInstances, githubInstances, loading } = useRepo();
  const { dateRange } = useDateRange();
  const [instanceContributions, setInstanceContributions] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        
        // Create a map to store contributions per instance
        const contributionsPerInstance = new Map<string, number>();
        
        // Process each GitLab instance
        for (const instance of gitlabInstances) {
          try {
            // Fetch user data
            const userData = await fetchGitLabUser(instance);
            const userKey = `${userData.username}-${userData.email}`;
            
            // Fetch contributions using the date range from context
            const contributions = await fetchContributions(
              instance, 
              dateRange.startDateString, 
              dateRange.endDateString
            );
            
            const totalContributionsForInstance = contributions.reduce((sum, c) => sum + c.count, 0);
            
            // Store contributions for this instance
            contributionsPerInstance.set(instance.id, totalContributionsForInstance);
            
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
            
            // Fetch contributions using the date range from context
            const contributions = await fetchGitHubContributions(
              instance, 
              dateRange.startDateString, 
              dateRange.endDateString
            );
            
            const totalContributionsForInstance = contributions.reduce((sum, c) => sum + c.count, 0);
            
            // Store contributions for this instance
            contributionsPerInstance.set(instance.id, totalContributionsForInstance);
            
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
        
        // Update the instance contributions state
        setInstanceContributions(contributionsPerInstance);
        
        // Convert map to array and sort by total contributions
        Array.from(usersMap.values())
          .sort((a, b) => b.totalContributions - a.totalContributions);
        
        // No need to set or use leaderboard variable
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        setError('Failed to fetch leaderboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [gitlabInstances, githubInstances, loading, dateRange.startDateString, dateRange.endDateString]);

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
  
  // Sort instances by total contributions
  const sortedInstances = [...allInstances].sort((a, b) => {
    const aContributions = instanceContributions.get(a.id) || 0;
    const bContributions = instanceContributions.get(b.id) || 0;
    return bContributions - aContributions;
  });
  
  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <div className="flex flex-wrap items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Instance Leaderboard</h2>
        <p className="text-sm text-muted-foreground">
          Contributions in {dateRange.label}
        </p>
      </div>
      
      {isLoading && (
        <div className="animate-pulse space-y-4">
          <div className="flex items-center mb-4">
            <div className="spinner"></div>
            <span className="text-muted-foreground">Loading leaderboard data...</span>
          </div>
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
              {[1, 2, 3, 4].map((_, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="py-3 pr-2">
                    <div className="skeleton h-4 w-4"></div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="skeleton h-4 w-28"></div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="skeleton h-4 w-16"></div>
                  </td>
                  <td className="py-3 text-right">
                    <div className="skeleton h-4 w-12 ml-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
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
                // Determine the instance type
                const isGitHub = 'username' in instance;
                const contributions = instanceContributions.get(instance.id) || 0;
                
                return (
                  <tr key={instance.id} className="border-b border-border">
                    <td className="py-3 pr-4">{index + 1}</td>
                    <td className="py-3 pr-4">{instance.name}</td>
                    <td className="py-3 pr-4">
                      {isGitHub ? (
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
                      <span className="font-semibold">{contributions}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 