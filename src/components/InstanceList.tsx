"use client";

import React, { useState } from 'react';
import { useGitLab } from '../lib/gitlabContext';
import { GitLabInstance } from '../types';
import InstanceForm from './InstanceForm';

export default function InstanceList() {
  const { instances, removeInstance } = useGitLab();
  const [editingInstance, setEditingInstance] = useState<GitLabInstance | null>(null);

  const handleEdit = (instance: GitLabInstance) => {
    setEditingInstance(instance);
  };

  const handleCancelEdit = () => {
    setEditingInstance(null);
  };

  if (instances.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">GitLab Instances</h2>
        <p className="text-gray-500">No GitLab instances added yet. Add one to get started.</p>
      </div>
    );
  }

  if (editingInstance) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Edit GitLab Instance</h2>
        <InstanceForm 
          instanceToEdit={editingInstance} 
          onCancel={handleCancelEdit} 
        />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">GitLab Instances</h2>
      
      <ul className="divide-y divide-gray-200">
        {instances.map(instance => (
          <li key={instance.id} className="py-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{instance.name}</h3>
                <p className="text-sm text-gray-500">{instance.baseUrl}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(instance)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeInstance(instance.id)}
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