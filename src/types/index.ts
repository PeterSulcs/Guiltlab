export interface GitLabInstance {
  id: string;
  name: string;
  baseUrl: string;
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
  id: number;
  username: string;
  name: string;
  avatarUrl: string;
  email: string;
}

export interface LeaderboardEntry {
  user: UserData;
  totalContributions: number;
  instances: {
    instanceId: string;
    contributions: number;
  }[];
} 