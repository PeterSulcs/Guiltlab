"use client";

import React from 'react';
import { useTeam } from '../lib/teamContext';
import { FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';

export default function TeamMemberList() {
  const { teamMembers, removeTeamMember, loading } = useTeam();

  const handleRemoveMember = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from the team?`)) {
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
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-background">
              <div className="flex items-center space-x-3">
                {member.avatarUrl ? (
                  <img 
                    src={member.avatarUrl} 
                    alt={member.name} 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <FiUser className="text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    GitLab: @{member.gitlabUsername}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleRemoveMember(member.id, member.name)}
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