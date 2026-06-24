import type {
  ApiEventMessage,
  ApiResponse,
  ListenStatus,
  MachineData,
  MachineInput,
  NotionConfigStatus,
} from '../shared/api-types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  const result = (await response.json()) as ApiResponse<T>;

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}

export const api = {
  async getMachines(): Promise<MachineData[]> {
    const data = await request<{ machines: MachineData[] }>('/api/machines');
    return data.machines;
  },

  async addMachine(input: MachineInput): Promise<MachineData> {
    const data = await request<{ machine: MachineData }>('/api/machines', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return data.machine;
  },

  async removeMachine(id: string): Promise<void> {
    await request(`/api/machines/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async connectMachine(id: string): Promise<void> {
    await request(`/api/machines/${encodeURIComponent(id)}/connect`, { method: 'POST' });
  },

  async disconnectMachine(id: string): Promise<void> {
    await request(`/api/machines/${encodeURIComponent(id)}/disconnect`, { method: 'POST' });
  },

  async connectAll(): Promise<void> {
    await request('/api/machines/connect-all', { method: 'POST' });
  },

  async disconnectAll(): Promise<void> {
    await request('/api/machines/disconnect-all', { method: 'POST' });
  },

  getNotionConfig(): Promise<NotionConfigStatus> {
    return request('/api/notion/config');
  },

  setNotionConfig(token: string, databaseId: string): Promise<void> {
    return request('/api/notion/config', {
      method: 'POST',
      body: JSON.stringify({ token, databaseId }),
    });
  },

  testNotionConnection(): Promise<void> {
    return request('/api/notion/test-connection', { method: 'POST' });
  },

  clearNotionConfig(): Promise<void> {
    return request('/api/notion/config', { method: 'DELETE' });
  },

  getListenStatus(): Promise<ListenStatus> {
    return request('/api/listen');
  },

  setListenEnabled(enabled: boolean): Promise<ListenStatus> {
    return request('/api/listen', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
  },

  subscribe(onMessage: (message: ApiEventMessage) => void, onDisconnect?: () => void): () => void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/events`);

    socket.addEventListener('message', (event) => {
      try {
        onMessage(JSON.parse(event.data) as ApiEventMessage);
      } catch (error) {
        console.error('Invalid event payload', error);
      }
    });

    socket.addEventListener('close', () => {
      onDisconnect?.();
    });

    return () => socket.close();
  },
};
