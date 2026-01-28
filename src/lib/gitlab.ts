import axios from 'axios';

export function getGitLabClient(baseUrl: string, token: string) {
  return axios.create({
    baseURL: `${baseUrl}/api/v4`,
    headers: {
      'PRIVATE-TOKEN': token,
    },
  });
} 