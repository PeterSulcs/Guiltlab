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
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">GitHub Instances</h2>
        <p className="text-gray-500">No GitHub instances added yet. Add one to aggregate GitHub contributions.</p>
      </div>
    );
  }

  if (editingInstance) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Edit GitHub Instance</h2>
        <GitHubInstanceForm 
          instanceToEdit={editingInstance} 
          onCancel={handleCancelEdit} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">GitHub Instances</h2>
      
      <ul className="divide-y divide-gray-200">
        {githubInstances.map(instance => (
          <li key={instance.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{instance.name}</h3>
                <p className="text-sm text-gray-500">@{instance.username}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(instance)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeGitHubInstance(instance.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
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