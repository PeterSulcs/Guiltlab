"use client";

import React, { useState } from 'react';
import { useTeam } from '../lib/teamContext';
import { useRepo } from '../lib/repoContext';

export default function TeamMemberForm() {
  const { addTeamMember } = useTeam();
  const { gitlabInstances, githubInstances } = useRepo();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [instanceUsernames, setInstanceUsernames] = useState<{
    instanceId: string;
    username: string;
    instanceType: 'gitlab' | 'github';
  }[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle adding a GitLab instance username
  const handleAddGitLabUsername = (instanceId: string, username: string) => {
    if (!username.trim()) return;
    
    // Check if we already have a username for this instance
    const existingIndex = instanceUsernames.findIndex(iu => iu.instanceId === instanceId);
    
    if (existingIndex >= 0) {
      // Update existing
      setInstanceUsernames(prev => {
        const newUsernames = [...prev];
        newUsernames[existingIndex] = {
          instanceId,
          username: username.trim(),
          instanceType: 'gitlab'
        };
        return newUsernames;
      });
    } else {
      // Add new
      setInstanceUsernames(prev => [
        ...prev,
        {
          instanceId,
          username: username.trim(),
          instanceType: 'gitlab'
        }
      ]);
    }
  };

  // Handle adding a GitHub instance username
  const handleAddGitHubUsername = (instanceId: string, username: string) => {
    if (!username.trim()) return;
    
    // Check if we already have a username for this instance
    const existingIndex = instanceUsernames.findIndex(iu => iu.instanceId === instanceId);
    
    if (existingIndex >= 0) {
      // Update existing
      setInstanceUsernames(prev => {
        const newUsernames = [...prev];
        newUsernames[existingIndex] = {
          instanceId,
          username: username.trim(),
          instanceType: 'github'
        };
        return newUsernames;
      });
    } else {
      // Add new
      setInstanceUsernames(prev => [
        ...prev,
        {
          instanceId,
          username: username.trim(),
          instanceType: 'github'
        }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!displayName.trim() || instanceUsernames.length === 0) {
        throw new Error('Display name and at least one instance username are required');
      }

      // Add the team member
      addTeamMember({
        displayName: displayName.trim(),
        username: username.trim() || displayName.trim(),
        instanceUsernames,
      });

      // Reset the form
      setDisplayName('');
      setUsername('');
      setInstanceUsernames([]);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add team member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get current username for an instance
  const getInstanceUsername = (instanceId: string) => {
    const instance = instanceUsernames.find(iu => iu.instanceId === instanceId);
    return instance ? instance.username : '';
  };

  return (
    <div className="bg-card-background rounded-lg shadow border border-border p-6">
      <h3 className="text-lg font-medium mb-4">Add Team Member</h3>
      
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">
              Display Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input"
              placeholder="John Doe"
              required
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium mb-1">
              Username (optional)
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input"
              placeholder="johndoe"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Display username (defaults to display name if empty)
            </p>
          </div>
          
          {gitlabInstances.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">GitLab Usernames</h4>
              <div className="space-y-3">
                {gitlabInstances.map(instance => (
                  <div key={instance.id} className="flex items-center">
                    <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                    <input
                      type="text"
                      value={getInstanceUsername(instance.id)}
                      onChange={(e) => handleAddGitLabUsername(instance.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                      placeholder={`GitLab username for ${instance.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {githubInstances.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">GitHub Usernames</h4>
              <div className="space-y-3">
                {githubInstances.map(instance => (
                  <div key={instance.id} className="flex items-center">
                    <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                    <input
                      type="text"
                      value={getInstanceUsername(instance.id)}
                      onChange={(e) => handleAddGitHubUsername(instance.id, e.target.value)}
                      className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                      placeholder={`GitHub username for ${instance.name}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <div className="spinner"></div>
                  Adding...
                </span>
              ) : 'Add Team Member'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 