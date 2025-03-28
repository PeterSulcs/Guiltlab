"use client";

import React, { useState } from 'react';
import { useTeam } from '../lib/teamContext';
import { useRepo } from '../lib/repoContext';
import { FiTrash2, FiUser, FiEdit2 } from 'react-icons/fi';
import { TeamMember } from '../types';

export default function TeamMemberList() {
  const { teamMembers, removeTeamMember, updateTeamMember, loading } = useTeam();
  const { gitlabInstances, githubInstances } = useRepo();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editFormUsernames, setEditFormUsernames] = useState<{
    instanceId: string;
    username: string;
    instanceType: 'gitlab' | 'github';
  }[]>([]);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // Initialize edit form with member data
  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setEditDisplayName(member.displayName);
    setEditUsername(member.username);
    setEditFormUsernames(member.instanceUsernames || []);
  };

  // Handle cancelling edit
  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditDisplayName('');
    setEditUsername('');
    setEditFormUsernames([]);
  };

  // Handle saving edit
  const handleSaveEdit = () => {
    if (!editingMember) return;
    
    updateTeamMember(editingMember.id, {
      displayName: editDisplayName,
      username: editUsername,
      instanceUsernames: editFormUsernames
    });
    
    handleCancelEdit();
  };

  // Handle adding or updating a GitLab username
  const handleEditGitLabUsername = (instanceId: string, username: string) => {
    if (!username.trim()) return;
    
    const existingIndex = editFormUsernames.findIndex(
      iu => iu.instanceId === instanceId && iu.instanceType === 'gitlab'
    );
    
    if (existingIndex >= 0) {
      // Update existing
      setEditFormUsernames(prev => {
        const newUsernames = [...prev];
        newUsernames[existingIndex] = {
          instanceId,
          username: username.trim(),
          instanceType: 'gitlab'
        };
        return newUsernames;
      });
    } else {
      // Add new
      setEditFormUsernames(prev => [
        ...prev,
        {
          instanceId,
          username: username.trim(),
          instanceType: 'gitlab'
        }
      ]);
    }
  };

  // Handle adding or updating a GitHub username
  const handleEditGitHubUsername = (instanceId: string, username: string) => {
    if (!username.trim()) return;
    
    const existingIndex = editFormUsernames.findIndex(
      iu => iu.instanceId === instanceId && iu.instanceType === 'github'
    );
    
    if (existingIndex >= 0) {
      // Update existing
      setEditFormUsernames(prev => {
        const newUsernames = [...prev];
        newUsernames[existingIndex] = {
          instanceId,
          username: username.trim(),
          instanceType: 'github'
        };
        return newUsernames;
      });
    } else {
      // Add new
      setEditFormUsernames(prev => [
        ...prev,
        {
          instanceId,
          username: username.trim(),
          instanceType: 'github'
        }
      ]);
    }
  };

  // Helper function to get current username for an instance
  const getEditInstanceUsername = (instanceId: string, instanceType: 'gitlab' | 'github') => {
    const instance = editFormUsernames.find(
      iu => iu.instanceId === instanceId && iu.instanceType === instanceType
    );
    return instance ? instance.username : '';
  };

  const handleRemoveMember = (id: string, displayName: string) => {
    if (confirm(`Are you sure you want to remove ${displayName} from the team?`)) {
      removeTeamMember(id);
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
                
                <div>
                  <label htmlFor="edit-username" className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="edit-username"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input"
                    placeholder="johndoe"
                  />
                </div>
                
                {gitlabInstances.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">GitLab Usernames</h5>
                    <div className="space-y-3">
                      {gitlabInstances.map(instance => (
                        <div key={instance.id} className="flex items-center">
                          <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                          <input
                            type="text"
                            value={getEditInstanceUsername(instance.id, 'gitlab')}
                            onChange={(e) => handleEditGitLabUsername(instance.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                            placeholder={`GitLab username for ${instance.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {githubInstances.length > 0 && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">GitHub Usernames</h5>
                    <div className="space-y-3">
                      {githubInstances.map(instance => (
                        <div key={instance.id} className="flex items-center">
                          <div className="w-1/3 mr-2 text-sm text-muted-foreground">{instance.name}:</div>
                          <input
                            type="text"
                            value={getEditInstanceUsername(instance.id, 'github')}
                            onChange={(e) => handleEditGitHubUsername(instance.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-border rounded-md bg-input text-sm"
                            placeholder={`GitHub username for ${instance.name}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    disabled={!editDisplayName.trim()}
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-background border border-border rounded-md hover:bg-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Team Members List */}
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
              <div className="flex items-center space-x-3">
                {member.avatarUrl ? (
                  <img 
                    src={member.avatarUrl} 
                    alt={member.displayName} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <FiUser className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    @{member.username}
                  </p>
                  <div className="mt-1 space-y-1">
                    {/* Show GitLab usernames */}
                    {member.instanceUsernames?.filter(iu => iu.instanceType === 'gitlab')
                      .map(iu => {
                        const instance = gitlabInstances.find(i => i.id === iu.instanceId);
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