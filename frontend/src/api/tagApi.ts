import client from './client';
import type { TagDto, Tactic } from '../types';

export const tagApi = {
  getAll: () => client.get<TagDto[]>('/tags').then(r => r.data),
  getTacticsByTag: (name: string) => client.get<Tactic[]>(`/tags/${name}/tactics`).then(r => r.data),
};
