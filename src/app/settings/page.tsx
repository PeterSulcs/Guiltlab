"use client";

import React, { useState } from 'react';
import InstanceManager from "@/components/InstanceManager";
import GitHubInstanceForm from "@/components/GitHubInstanceForm";
import GitHubInstanceList from "@/components/GitHubInstanceList";
import TeamMemberForm from "@/components/TeamMemberForm";
import TeamMemberList from "@/components/TeamMemberList";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'gitlab' | 'github' | 'team'>('gitlab');
  
  return (
    <div className="py-6 px-4 w-full overflow-hidden">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your GitLab and GitHub instances, and team members
        </p>
      </div>
      
      {/* Tab navigation */}
      <div className="border-b border-border mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('gitlab')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'gitlab'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            GitLab
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'github'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            GitHub
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Team Members
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      {activeTab === 'gitlab' && (
        <div className="space-y-6">
          <InstanceManager />
        </div>
      )}
      
      {activeTab === 'github' && (
        <div className="space-y-6">
          <GitHubInstanceForm />
          <GitHubInstanceList />
        </div>
      )}
      
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <TeamMemberForm />
          </div>
          <div className="space-y-6">
            <TeamMemberList />
          </div>
        </div>
      )}
    </div>
  );
} 