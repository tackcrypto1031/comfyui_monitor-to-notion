/**
 * IPC Channel types and interfaces
 */

// Main → Renderer channels
export type MainToRendererChannel =
  | 'machines:status-update'
  | 'machines:connected'
  | 'machines:disconnected'
  | 'machines:error';

// Renderer → Main channels
export type RendererToMainChannel =
  | 'machines:get'
  | 'machines:add'
  | 'machines:remove'
  | 'machines:update'
  | 'machines:connect'
  | 'machines:disconnect'
  | 'machines:connect-all'
  | 'machines:disconnect-all'
  | 'notion:get-config'
  | 'notion:set-config'
  | 'notion:test-connection'
  | 'notion:clear-config';

// Machine data types
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

// IPC Payload types
export interface IPCPayload {
  'machines:status-update': { machines: MachineData[] };
  'machines:connected': { machineId: string };
  'machines:disconnected': { machineId: string; reason?: string };
  'machines:error': { machineId: string; error: string };
  'machines:get': void;
  'machines:add': MachineInput;
  'machines:remove': { id: string };
  'machines:update': { id: string; updates: Partial<MachineInput> };
  'machines:connect': { id: string };
  'machines:disconnect': { id: string };
  'machines:connect-all': void;
  'machines:disconnect-all': void;
  'notion:get-config': void;
  'notion:set-config': { token: string; databaseId: string };
  'notion:test-connection': void;
  'notion:clear-config': void;
}

// Request/Response types
export interface IPCRequest<T extends RendererToMainChannel> {
  channel: T;
  payload: IPCPayload[T];
}

export interface IPCResponse<T extends RendererToMainChannel> {
  success: boolean;
  data?: any;
  error?: string;
}

// Main process API exposed to renderer
export interface ElectronAPI {
  // Invoke (Renderer → Main with response)
  invoke: <T extends RendererToMainChannel>(channel: T, payload: IPCPayload[T]) => Promise<IPCResponse<T>>;
  
  // Subscribe (Main → Renderer events)
  on: <T extends MainToRendererChannel>(channel: T, callback: (data: IPCPayload[T]) => void) => () => void;
  
  // Platform info
  platform: string;
}

// Global window interface
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
