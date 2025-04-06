"use client";

import React, { useState } from 'react';
import { useRepo } from '@/lib/repoContext';
import { useSelection } from '@/lib/selectionContext';

interface InstanceFormData {
  name: string;
  baseUrl: string;
  token: string;
}

export default function InstanceManager() {
  const { instances, addInstance, editInstance, removeInstance, loading: repoLoading } = useRepo();
  const { selectedInstanceId, setSelectedInstanceId } = useSelection();
  const [formData, setFormData] = useState<InstanceFormData>({
    name: '',
    baseUrl: '',
    token: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingId) {
        await editInstance(editingId, formData);
      } else {
        await addInstance(formData);
      }
      setFormData({ name: '', baseUrl: '', token: '' });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save instance');
    }
  };

  const handleEdit = (id: string) => {
    const instance = instances.find(i => i.id === id);
    if (instance) {
      setFormData({
        name: instance.name,
        baseUrl: instance.baseUrl,
        token: instance.token,
      });
      setEditingId(id);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeInstance(id);
      if (id === selectedInstanceId) {
        setSelectedInstanceId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete instance');
    }
  };

  return (
    <div className="instance-manager">
      <h2 className="text-xl font-semibold mb-4">GitLab Instances</h2>
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-medium mb-1">
              Base URL
            </label>
            <input
              type="url"
              id="baseUrl"
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-1">
              Access Token
            </label>
            <input
              type="password"
              id="token"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          >
            {editingId ? 'Update Instance' : 'Add Instance'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setFormData({ name: '', baseUrl: '', token: '' });
                setEditingId(null);
              }}
              className="ml-2 px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/90"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="mb-4 p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instances.map((instance) => (
          <div
            key={instance.id}
            className={`instance-card p-4 bg-card-background rounded-lg shadow border ${
              instance.id === selectedInstanceId ? 'border-primary' : 'border-border'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-medium">{instance.name}</h3>
                <p className="text-sm text-muted-foreground">{instance.baseUrl}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(instance.id)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(instance.id)}
                  className="p-1 text-destructive hover:text-destructive/90"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedInstanceId(instance.id)}
              className={`w-full mt-2 p-2 rounded ${
                instance.id === selectedInstanceId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/90'
              }`}
            >
              {instance.id === selectedInstanceId ? 'Selected' : 'Select'}
            </button>
          </div>
        ))}
      </div>

      {repoLoading && (
        <div className="mt-4 text-center text-muted-foreground">
          Loading...
        </div>
      )}
    </div>
  );
} 