export interface GitLabInstance {
  id: string;
  name: string;
  baseUrl: string;
  token: string;
}

export interface GitHubInstance {
  id: string;
  name: string;
  username: string;
  token: string;
}

export interface RepoInstance {
  id: string;
  name: string;
  type: 'gitlab' | 'github';
  baseUrl?: string;
  username?: string;
  token: string;
}

export interface ContributionData {
  date: string;
  count: number;
  instanceId: string;
}

export interface AggregatedContribution {
  date: string;
  count: number;
  contributions: {
    instanceId: string;
    count: number;
  }[];
}

export interface UserData {
  id: number | string;
  username: string;
  name: string;
  avatarUrl: string;
  email: string;
  isTeamMember?: boolean;
}

export interface LeaderboardEntry {
  user: UserData;
  totalContributions: number;
  instances: {
    instanceId: string;
    contributions: number;
  }[];
}

export interface TeamMember {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
  addedAt: string;
  instanceUsernames: {
    instanceId: string;
    username: string;
    instanceType: 'gitlab' | 'github';
  }[];
}

export interface TeamLeaderboardEntry {
  member: TeamMember;
  totalContributions: number;
  contributionsByInstance: {
    instanceId: string;
    instanceName: string;
    contributions: number;
  }[];
  contributionsByDate: {
    date: string;
    count: number;
  }[];
} 