/**
 * Machine configuration types
 */

export type MachineStatus = 'idle' | 'running' | 'generating';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface MachineConfig {
  id: string;
  name: string;
  ip: string;
  port: number;
  status: MachineStatus;
  connectionStatus: ConnectionStatus;
  lastUpdate?: number;
  errorMessage?: string;
}

export interface MachineConfigInput {
  name: string;
  ip: string;
  port: number;
}
