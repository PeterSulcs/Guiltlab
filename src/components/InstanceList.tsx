"use client";
import React, { useState } from 'react';
import { GitLabInstance } from '@/types';
import { useRepo } from '@/lib/repoContext';
import InstanceForm from './InstanceForm';
import Spinner from './ui/spinner';

export default function InstanceList() {
  const { instances, removeInstance, loading } = useRepo();
  const [editingInstance, setEditingInstance] = useState<GitLabInstance | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filter GitLab instances
  const gitlabInstances = instances.filter(instance => 
    'baseUrl' in instance
  ) as GitLabInstance[];

  const handleRemove = async (instance: GitLabInstance) => {
    if (!confirm(`Are you sure you want to remove ${instance.name}?`)) {
      return;
    }

    setIsRemoving(instance.id);
    setError(null);

    try {
      await removeInstance(instance.id);
    } catch (err: any) {
      setError(err.message || 'Failed to remove instance');
    } finally {
      setIsRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive rounded">
        {error}
      </div>
    );
  }

  if (editingInstance) {
    return (
      <InstanceForm
        instanceToEdit={editingInstance}
        onCancel={() => setEditingInstance(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-2 bg-destructive/10 text-destructive rounded">
          {error}
        </div>
      )}

      {gitlabInstances.length === 0 ? (
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted rounded">
            <p className="text-muted-foreground">No GitLab instances added yet.</p>
          </div>
          <InstanceForm />
        </div>
      ) : (
        <div className="space-y-4">
          {!showForm && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Add GitLab Instance
              </button>
            </div>
          )}
          {showForm && (
            <div className="mb-4">
              <InstanceForm onCancel={() => setShowForm(false)} />
            </div>
          )}
          <div className="grid gap-4">
            {gitlabInstances.map((instance) => (
              <div
                key={instance.id}
                className="p-4 bg-card-background rounded-lg shadow border border-border"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{instance.name}</h3>
                    <p className="text-sm text-muted-foreground">{instance.baseUrl}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingInstance(instance)}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isRemoving === instance.id}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemove(instance)}
                      className="p-2 text-destructive hover:opacity-80 transition-opacity"
                      disabled={isRemoving === instance.id}
                    >
                      {isRemoving === instance.id ? (
                        <Spinner className="h-5 w-5" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 