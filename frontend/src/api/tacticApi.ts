import client from './client';
import type { Tactic, TacticVersion, ValidationResult, VersionCompare } from '../types';

export const tacticApi = {
  getAll: (params?: { tags?: string[]; search?: string }) =>
    client.get<Tactic[]>('/tactics', { params }).then(r => r.data),
  getById: (id: number) => client.get<Tactic>(`/tactics/${id}`).then(r => r.data),
  create: (data: { name: string; description?: string; teamId?: number | null; opponentTeamId?: number | null; isPublic?: boolean; tags?: string[]; frames?: string }) =>
    client.post<Tactic>('/tactics', data).then(r => r.data),
  update: (id: number, data: { name?: string; description?: string; teamId?: number | null; opponentTeamId?: number | null; isPublic?: boolean; tags?: string[] }) =>
    client.put<Tactic>(`/tactics/${id}`, data).then(r => r.data),
  delete: (id: number) => client.delete(`/tactics/${id}`),

  getVersions: (tacticId: number) =>
    client.get<TacticVersion[]>(`/tactics/${tacticId}/versions`).then(r => r.data),
  getVersion: (tacticId: number, versionId: number) =>
    client.get<TacticVersion>(`/tactics/${tacticId}/versions/${versionId}`).then(r => r.data),
  createVersion: (tacticId: number, data: { label?: string; frames: string }) =>
    client.post<TacticVersion>(`/tactics/${tacticId}/versions`, data).then(r => r.data),
  compareVersions: (tacticId: number, v1: number, v2: number) =>
    client.get<VersionCompare>(`/tactics/${tacticId}/versions/compare`, { params: { v1, v2 } }).then(r => r.data),

  getShared: (uuid: string) => client.get<Tactic>(`/shared/${uuid}`).then(r => r.data),
  fork: (uuid: string) => client.post<Tactic>(`/shared/${uuid}/fork`).then(r => r.data),

  validateLineup: (frames: string) =>
    client.post<ValidationResult>('/validate/lineup', frames).then(r => r.data),

  exportGif: (tacticId: number, versionId: number) =>
    client.post(`/tactics/${tacticId}/versions/${versionId}/export/gif`, null, { responseType: 'blob' })
      .then(r => r.data),
};
