"use client";

import React, { useState } from 'react';
import { useRepo } from '../lib/repoContext';
import { GitLabInstance } from '../types';
import InstanceForm from './InstanceForm';

export default function InstanceList() {
  const { gitlabInstances, removeGitLabInstance } = useRepo();
  const [editingInstance, setEditingInstance] = useState<GitLabInstance | null>(null);

  const handleEdit = (instance: GitLabInstance) => {
    setEditingInstance(instance);
  };

  const handleCancelEdit = () => {
    setEditingInstance(null);
  };

  if (gitlabInstances.length === 0) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">GitLab Instances</h2>
        <p className="text-muted-foreground">No GitLab instances added yet. Add one to get started.</p>
      </div>
    );
  }

  if (editingInstance) {
    return (
      <div className="p-4 bg-card-background rounded-lg shadow border border-border">
        <h2 className="text-xl font-semibold mb-4">Edit GitLab Instance</h2>
        <InstanceForm 
          instanceToEdit={editingInstance} 
          onCancel={handleCancelEdit} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-card-background rounded-lg shadow border border-border">
      <h2 className="text-xl font-semibold mb-4">GitLab Instances</h2>
      
      <ul className="divide-y divide-border">
        {gitlabInstances.map((instance: GitLabInstance) => (
          <li key={instance.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{instance.name}</h3>
                <p className="text-sm text-muted-foreground">{instance.baseUrl}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(instance)}
                  className="text-primary hover:opacity-80 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeGitLabInstance(instance.id)}
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