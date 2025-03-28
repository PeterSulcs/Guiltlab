"use client";

import React, { useState, useEffect } from 'react';
import { useGitLab } from '../lib/gitlabContext';
import { GitLabInstance } from '../types';

interface InstanceFormProps {
  instanceToEdit?: GitLabInstance;
  onCancel?: () => void;
}

export default function InstanceForm({ instanceToEdit, onCancel }: InstanceFormProps) {
  const { addInstance, editInstance } = useGitLab();
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    token: ''
  });
  const [error, setError] = useState('');
  const isEditing = !!instanceToEdit;

  // Set form data when editing an instance
  useEffect(() => {
    if (instanceToEdit) {
      setFormData({
        name: instanceToEdit.name,
        baseUrl: instanceToEdit.baseUrl,
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
    if (!formData.name || !formData.baseUrl || !formData.token) {
      setError('All fields are required');
      return;
    }

    // Remove trailing slash from baseUrl if present
    const baseUrl = formData.baseUrl.endsWith('/')
      ? formData.baseUrl.slice(0, -1)
      : formData.baseUrl;

    try {
      if (isEditing && instanceToEdit) {
        // Update the instance
        editInstance(instanceToEdit.id, {
          name: formData.name,
          baseUrl,
          token: formData.token
        });
        
        if (onCancel) onCancel(); // Close the edit form
      } else {
        // Create the instance object
        const newInstance: GitLabInstance = {
          id: crypto.randomUUID(),
          name: formData.name,
          baseUrl,
          token: formData.token
        };
        
        // Add the instance
        addInstance(newInstance);
        
        // Reset form
        setFormData({
          name: '',
          baseUrl: '',
          token: ''
        });
      }
    } catch (error) {
      setError('Failed to add GitLab instance. Please check your credentials and try again.');
      console.error('Error adding instance:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {isEditing ? 'Edit GitLab Instance' : 'Add GitLab Instance'}
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
            placeholder="My GitLab"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="baseUrl">
            Base URL
          </label>
          <input
            type="url"
            id="baseUrl"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://gitlab.example.com"
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
            Token needs read_user and read_api scopes
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