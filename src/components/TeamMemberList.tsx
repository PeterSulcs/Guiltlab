"use client";

import React, { useState } from 'react';
import { useTeam } from '../lib/teamContext';
import { useRepo } from '../lib/repoContext';
import { FiTrash2, FiUser, FiEdit2 } from 'react-icons/fi';
import Image from 'next/image';

interface TeamMember {
  id: string;
  displayName: string;
  instanceUsernames: {
    instanceId: string;
    username: string;
    instanceType: 'gitlab' | 'github';
  }[];
}

export default function TeamMemberList() {
  const { teamMembers, removeTeamMember, updateTeamMember, loading } = useTeam();
  const { instances, githubInstances } = useRepo();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editInstanceUsernames, setEditInstanceUsernames] = useState<{
    instanceId: string;
    username: string;
    instanceType: 'gitlab' | 'github';
  }[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditDisplayName(member.displayName);
    setEditInstanceUsernames(member.instanceUsernames);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditDisplayName('');
    setEditInstanceUsernames([]);
    setError('');
  };

  const handleEditInstanceUsername = (instanceId: string, username: string, instanceType: 'gitlab' | 'github') => {
    setEditInstanceUsernames(prev => {
      const existing = prev.find(iu => iu.instanceId === instanceId);
      if (existing) {
        return prev.map(iu => 
          iu.instanceId === instanceId 
            ? { ...iu, username: username.trim() }
            : iu
        );
      }
      return [...prev, { instanceId, username: username.trim(), instanceType }];
    });
  };

  const getEditInstanceUsername = (instanceId: string, instanceType: 'gitlab' | 'github') => {
    const instanceUsername = editInstanceUsernames.find(
      iu => iu.instanceId === instanceId && iu.instanceType === instanceType
    );
    return instanceUsername?.username || '';
  };

  const handleSaveEdit = async () => {
    if (!editingMember || !editDisplayName.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await updateTeamMember(editingMember.id, {
        displayName: editDisplayName.trim(),
        instanceUsernames: editInstanceUsernames
      });
      handleCancelEdit();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to update team member');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (id: string, displayName: string) => {
    if (!confirm(`Are you sure you want to remove ${displayName} from the team?`)) {
      return;
    }

    try {
      await removeTeamMember(id);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to remove team member');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-card-background rounded-lg shadow border border-border p-6">
        <h3 className="text-lg font-medium mb-4">Team Members</h3>
        <p className="text-muted-foreground">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="bg-card-background rounded-lg shadow border border-border p-6">
      <h3 className="text-lg font-medium mb-4">Team Members</h3>
      
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {teamMembers.length === 0 ? (
        <p className="text-muted-foreground">No team members added yet. Add a team member to get started.</p>
      ) : (
        <div className="space-y-4">
          {/* Edit Form */}
          {editingMember && (
            <div className="p-4 border border-border rounded-md bg-background mb-4">
              <h4 className="font-medium mb-3">Edit Team Member</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-displayName" className="block text-sm font-medium mb-1">
                    Display Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    id="edit-displayName"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* GitLab Usernames */}
                {instances.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">GitLab Usernames</h4>
                    <div className="space-y-3">
                      {instances.map(instance => (
                        <div key={instance.id} className="flex items-center">
                          <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                          <input
                            type="text"
                            value={getEditInstanceUsername(instance.id, 'gitlab')}
                            onChange={(e) => handleEditInstanceUsername(instance.id, e.target.value, 'gitlab')}
                            className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                            placeholder={`GitLab username for ${instance.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* GitHub Usernames */}
                {githubInstances.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">GitHub Usernames</h4>
                    <div className="space-y-3">
                      {githubInstances.map(instance => (
                        <div key={instance.id} className="flex items-center">
                          <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                          <input
                            type="text"
                            value={getEditInstanceUsername(instance.id, 'github')}
                            onChange={(e) => handleEditInstanceUsername(instance.id, e.target.value, 'github')}
                            className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                            placeholder={`GitHub username for ${instance.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-border rounded-md hover:bg-accent"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Team Members List */}
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <FiUser className="text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <div className="mt-1 space-y-1">
                    {/* Show GitLab usernames */}
                    {member.instanceUsernames?.filter(iu => iu.instanceType === 'gitlab')
                      .map(iu => {
                        const instance = instances.find(i => i.id === iu.instanceId);
                        return instance ? (
                          <div key={iu.instanceId} className="text-xs text-muted-foreground">
                            <span className="font-medium">{instance.name}</span>: @{iu.username}
                          </div>
                        ) : null;
                      })}
                    {/* Show GitHub usernames */}
                    {member.instanceUsernames?.filter(iu => iu.instanceType === 'github')
                      .map(iu => {
                        const instance = githubInstances.find(i => i.id === iu.instanceId);
                        return instance ? (
                          <div key={iu.instanceId} className="text-xs text-muted-foreground">
                            <span className="font-medium">{instance.name}</span>: @{iu.username}
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleEditMember(member)}
                  className="p-2 text-primary hover:bg-primary/10 rounded-md"
                  title="Edit member"
                >
                  <FiEdit2 size={16} />
                </button>
                <button 
                  onClick={() => handleRemoveMember(member.id, member.displayName)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                  title="Remove member"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 