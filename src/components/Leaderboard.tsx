"use client";

import React, { useState, useEffect } from 'react';
import { useGitLab } from '../lib/gitlabContext';
import { fetchContributions, fetchGitLabUser } from '../lib/gitlabApi';
import { LeaderboardEntry, UserData } from '../types';

export default function Leaderboard() {
  const { instances, loading } = useGitLab();
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
    if (instances.length === 0 || loading) return;
    
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
        
        // Process each instance
        for (const instance of instances) {
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
            console.error(`Error processing instance ${instance.name}:`, err);
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
  }, [instances, loading, startDateString, endDateString]);

  if (instances.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Contribution Leaderboard</h2>
        <p className="text-gray-500">Add GitLab instances to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Contribution Leaderboard</h2>
      
      {isLoading && <p className="text-gray-500">Loading leaderboard data...</p>}
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {!isLoading && !error && (
        <div>
          {leaderboardData.length === 0 ? (
            <p className="text-gray-500">No contribution data available for the last month.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contributions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instances
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.map((entry, index) => (
                    <tr key={`${entry.user.username}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.user.avatarUrl && (
                            <img 
                              className="h-8 w-8 rounded-full mr-3" 
                              src={entry.user.avatarUrl} 
                              alt={entry.user.name}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{entry.user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.totalContributions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <ul>
                          {entry.instances.map(instance => {
                            const instanceInfo = instances.find(i => i.id === instance.instanceId);
                            return (
                              <li key={instance.instanceId}>
                                {instanceInfo?.name}: {instance.contributions}
                              </li>
                            );
                          })}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 