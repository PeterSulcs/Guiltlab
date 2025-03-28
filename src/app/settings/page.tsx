"use client";

import React from 'react';
import InstanceForm from "@/components/InstanceForm";
import InstanceList from "@/components/InstanceList";
import GitHubInstanceForm from "@/components/GitHubInstanceForm";
import GitHubInstanceList from "@/components/GitHubInstanceList";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your GitLab and GitHub instances
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">GitLab</h2>
          <InstanceForm />
          <InstanceList />
        </div>
        
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">GitHub</h2>
          <GitHubInstanceForm />
          <GitHubInstanceList />
        </div>
      </div>
    </div>
  );
} 