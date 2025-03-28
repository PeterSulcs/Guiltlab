"use client";

import React, { useState, useEffect } from 'react';
import { useRepo } from '../lib/repoContext';
import { GitHubInstance } from '../types';

interface GitHubInstanceFormProps {
  instanceToEdit?: GitHubInstance;
  onCancel?: () => void;
}

export default function GitHubInstanceForm({ instanceToEdit, onCancel }: GitHubInstanceFormProps) {
  const { addGitHubInstance, editGitHubInstance } = useRepo();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    token: ''
  });
  const [error, setError] = useState('');
  const isEditing = !!instanceToEdit;

  // Set form data when editing an instance
  useEffect(() => {
    if (instanceToEdit) {
      setFormData({
        name: instanceToEdit.name,
        username: instanceToEdit.username,
        token: instanceToEdit.token
      });
    }
  }, [instanceToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.name || !formData.username || !formData.token) {
      setError('All fields are required');
      return;
    }

    try {
      if (isEditing && instanceToEdit) {
        // Update the instance
        editGitHubInstance(instanceToEdit.id, {
          name: formData.name,
          username: formData.username,
          token: formData.token
        });
        
        if (onCancel) onCancel(); // Close the edit form
      } else {
        // Create the instance object
        const newInstance: GitHubInstance = {
          id: crypto.randomUUID(),
          name: formData.name,
          username: formData.username,
          token: formData.token
        };
        
        // Add the instance
        addGitHubInstance(newInstance);
        
        // Reset form
        setFormData({
          name: '',
          username: '',
          token: ''
        });
      }
    } catch (error) {
      setError('Failed to add GitHub instance. Please check your credentials and try again.');
      console.error('Error adding GitHub instance:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit GitHub Instance' : 'Add GitHub Instance'}
      </h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="name">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="My GitHub"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="username">
            GitHub Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="octocat"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="token">
            Personal Access Token
          </label>
          <input
            type="password"
            id="token"
            name="token"
            value={formData.token}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Your personal access token"
          />
          <p className="text-xs text-gray-500 mt-1">
            Token needs read:user scope for contributions data
          </p>
        </div>
        
        <div className="flex flex-row space-x-2">
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
          >
            {isEditing ? 'Save Changes' : 'Add Instance'}
          </button>
          
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              className="py-2 px-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-md"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
} 