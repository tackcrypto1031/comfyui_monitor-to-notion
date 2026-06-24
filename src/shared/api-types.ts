export interface MachineData {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: 'idle' | 'running' | 'generating';
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastUpdate?: number;
  errorMessage?: string;
}

export interface MachineInput {
  name: string;
  ip: string;
  port: number;
}

export interface NotionConfigStatus {
  configured: boolean;
  validated: boolean;
  databaseId: string | null;
}

export interface ListenStatus {
  enabled: boolean;
  urls: string[];
  port: number;
  canManage: boolean;
}

export type ApiResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface ApiEvents {
  'machines:status-update': { machines: MachineData[] };
  'listen:status-update': ListenStatus;
}

export type ApiEventMessage<T extends keyof ApiEvents = keyof ApiEvents> = {
  [K in T]: {
    type: K;
    data: ApiEvents[K];
  };
}[T];
