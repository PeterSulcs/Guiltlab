"use client";

import React, { useState } from 'react';
import { useTeam } from '../lib/teamContext';

export default function TeamMemberForm() {
  const { addTeamMember } = useTeam();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [gitlabUsername, setGitlabUsername] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!name.trim() || !gitlabUsername.trim()) {
        throw new Error('Name and GitLab username are required');
      }

      // Prepare username if not provided
      const finalUsername = username.trim() || gitlabUsername.trim();

      // Add the team member
      addTeamMember({
        name: name.trim(),
        username: finalUsername,
        gitlabUsername: gitlabUsername.trim(),
      });

      // Reset the form
      setName('');
      setUsername('');
      setGitlabUsername('');
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
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              Display username (defaults to GitLab username if empty)
            </p>
          </div>
          
          <div>
            <label htmlFor="gitlabUsername" className="block text-sm font-medium mb-1">
              GitLab Username <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              id="gitlabUsername"
              value={gitlabUsername}
              onChange={(e) => setGitlabUsername(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input"
              placeholder="johndoe"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Username used across GitLab instances to fetch contributions
            </p>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Team Member'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 