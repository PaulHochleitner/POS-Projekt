import client from './client';
import type { Team, Player } from '../types';

export const teamApi = {
  getAll: () => client.get<Team[]>('/teams').then(r => r.data),
  getById: (id: number) => client.get<Team>(`/teams/${id}`).then(r => r.data),
  create: (data: { name: string; primaryColor: string; secondaryColor: string; logoUrl?: string }) =>
    client.post<Team>('/teams', data).then(r => r.data),
  update: (id: number, data: { name: string; primaryColor: string; secondaryColor: string; logoUrl?: string }) =>
    client.put<Team>(`/teams/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/teams/${id}`),

  getPlayers: (teamId: number) => client.get<Player[]>(`/teams/${teamId}/players`).then(r => r.data),
  createPlayer: (teamId: number, data: Omit<Player, 'id' | 'teamId'>) =>
    client.post<Player>(`/teams/${teamId}/players`, data).then(r => r.data),
  updatePlayer: (id: number, data: Omit<Player, 'id' | 'teamId'>) =>
    client.put<Player>(`/players/${id}`, data).then(r => r.data),
  deletePlayer: (id: number) => client.delete(`/players/${id}`),

  uploadPlayerImage: (playerId: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return client.post<Player>(`/players/${playerId}/image`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};
