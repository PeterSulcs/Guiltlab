"use client";

import React, { useState, useEffect } from 'react';
import { useRepo } from '../lib/repoContext';
import { GitHubInstance } from '../types';

interface GitHubInstanceFormProps {
  instanceToEdit?: GitHubInstance;
  onCancel?: () => void;
}

export default function GitHubInstanceForm({ instanceToEdit, onCancel }: GitHubInstanceFormProps = {}) {
  const { addGitHubInstance, editGitHubInstance } = useRepo();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const isEditing = !!instanceToEdit;
  
  // Initialize form with instance data when editing
  useEffect(() => {
    if (instanceToEdit) {
      setName(instanceToEdit.name);
      setUsername(instanceToEdit.username);
      setToken(instanceToEdit.token);
    }
  }, [instanceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      if (!name.trim() || !username.trim() || !token.trim()) {
        throw new Error('All fields are required');
      }
      
      if (isEditing && instanceToEdit) {
        // Update existing instance
        editGitHubInstance(instanceToEdit.id, {
          name: name.trim(),
          username: username.trim(),
          token: token.trim()
        });
        
        if (onCancel) {
          onCancel(); // Return to list view
        }
      } else {
        // Add new instance
        await addGitHubInstance({
          id: crypto.randomUUID(),
          name: name.trim(),
          username: username.trim(),
          token: token.trim()
        });
        
        // Reset form on success
        setName('');
        setUsername('');
        setToken('');
        setSuccess('GitHub instance added successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add GitHub instance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card-background rounded-lg shadow border border-border p-4">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit GitHub Account' : 'Add GitHub Account'}
      </h2>
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-2 bg-accent text-accent-foreground rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="github-name" className="block text-sm font-medium mb-1">
            Account Name
          </label>
          <input
            type="text"
            id="github-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="e.g., Personal GitHub"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="github-username" className="block text-sm font-medium mb-1">
            GitHub Username
          </label>
          <input
            type="text"
            id="github-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="e.g., octocat"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="github-token" className="block text-sm font-medium mb-1">
            Personal Access Token
          </label>
          <input
            type="password"
            id="github-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="Enter your GitHub token"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Token requires <code>read:user</code> scope
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground font-medium p-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Saving...' : 'Adding...') 
              : (isEditing ? 'Save Changes' : 'Add GitHub Account')}
          </button>
          
          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-muted text-muted-foreground font-medium p-2 rounded hover:opacity-90 transition-opacity"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 