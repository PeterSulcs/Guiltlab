export interface InstanceUsername {
  instanceId: string;
  username: string;
  instanceType: 'gitlab' | 'github';
}

export interface TeamMember {
  id: string;
  displayName: string;
  instanceUsernames: InstanceUsername[];
  createdAt: string;
  updatedAt: string;
} 