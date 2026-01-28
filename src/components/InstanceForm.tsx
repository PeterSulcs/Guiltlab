"use client";

import React, { useState, useEffect } from 'react';
import { GitLabInstance } from '@/types';
import { useRepo } from '@/lib/repoContext';
import Spinner from './ui/spinner';

interface InstanceFormProps {
  instanceToEdit?: GitLabInstance;
  onCancel?: () => void;
}

export default function InstanceForm({ instanceToEdit, onCancel }: InstanceFormProps = {}) {
  const { addInstance, editInstance } = useRepo();
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [token, setToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const isEditing = !!instanceToEdit;
  
  // Initialize form with instance data when editing
  useEffect(() => {
    if (instanceToEdit) {
      setName(instanceToEdit.name);
      setBaseUrl(instanceToEdit.baseUrl);
      setToken(instanceToEdit.token);
    }
  }, [instanceToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (!name.trim() || !baseUrl.trim() || !token.trim()) {
        throw new Error('All fields are required');
      }
      
      // Validate URL format
      try {
        new URL(baseUrl);
      } catch {
        throw new Error('Invalid URL format');
      }
      
      if (isEditing && instanceToEdit) {
        // Update existing instance
        await editInstance(instanceToEdit.id, {
          name: name.trim(),
          baseUrl: baseUrl.trim(),
          token: token.trim()
        });
        
        if (onCancel) {
          onCancel(); // Return to list view
        }
      } else {
        // Add new instance
        await addInstance({
          name: name.trim(),
          baseUrl: baseUrl.trim(),
          token: token.trim()
        });
        
        // Reset form on success
        setName('');
        setBaseUrl('');
        setToken('');
        setSuccess('GitLab instance added successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save instance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit GitLab Instance' : 'Add GitLab Instance'}
      </h2>
      
      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-2 bg-primary/10 text-primary rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Instance Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="Enter instance name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="baseUrl" className="block text-sm font-medium mb-1">
            Base URL
          </label>
          <input
            type="text"
            id="baseUrl"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="Enter GitLab instance URL"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="token" className="block text-sm font-medium mb-1">
            Personal Access Token
          </label>
          <input
            type="password"
            id="token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full p-2 border border-border rounded bg-input"
            placeholder="Enter your GitLab token"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Token requires <code>read_user</code>, <code>read_api</code>, and <code>read_repository</code> scopes 
            (especially <code>read_repository</code> for historical data)
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            type="submit"
            className="flex-1 bg-primary text-primary-foreground font-medium p-2 rounded hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (
                <span className="flex items-center justify-center space-x-2">
                  <Spinner className="h-5 w-5" />
                  <span>{isEditing ? 'Saving...' : 'Adding...'}</span>
                </span>
              ) 
              : (isEditing ? 'Save Changes' : 'Add GitLab Instance')}
          </button>
          
          {isEditing && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-muted text-muted-foreground font-medium p-2 rounded hover:opacity-90 transition-opacity"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 