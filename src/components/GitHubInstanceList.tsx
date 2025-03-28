"use client";

import React, { useState } from 'react';
import { useRepo } from '../lib/repoContext';
import { GitHubInstance } from '../types';
import GitHubInstanceForm from './GitHubInstanceForm';

export default function GitHubInstanceList() {
  const { githubInstances, removeGitHubInstance } = useRepo();
  const [editingInstance, setEditingInstance] = useState<GitHubInstance | null>(null);

  const handleEdit = (instance: GitHubInstance) => {
    setEditingInstance(instance);
  };

  const handleCancelEdit = () => {
    setEditingInstance(null);
  };

  if (githubInstances.length === 0) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">GitHub Instances</h2>
        <p className="text-muted-foreground">No GitHub instances added yet. Add one to aggregate GitHub contributions.</p>
      </div>
    );
  }

  if (editingInstance) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">Edit GitHub Instance</h2>
        <GitHubInstanceForm 
          instanceToEdit={editingInstance} 
          onCancel={handleCancelEdit} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <h2 className="text-xl font-semibold mb-4">GitHub Instances</h2>
      
      <ul className="divide-y divide-border">
        {githubInstances.map((instance: GitHubInstance) => (
          <li key={instance.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{instance.name}</h3>
                <p className="text-sm text-muted-foreground">@{instance.username}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(instance)}
                  className="text-primary hover:opacity-80 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeGitHubInstance(instance.id)}
                  className="text-destructive hover:opacity-80 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 