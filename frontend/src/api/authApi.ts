import client from './client';

interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    client.post<AuthResponse>('/auth/register', { username, email, password }).then(r => r.data),

  login: (username: string, password: string) =>
    client.post<AuthResponse>('/auth/login', { username, password }).then(r => r.data),
};
