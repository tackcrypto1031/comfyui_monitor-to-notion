import os from 'os';
import type { ListenStatus } from '../shared/api-types';

type ListenStatusListener = (status: ListenStatus) => void;

export class ListenManager {
  private enabled = false;
  private listeners = new Set<ListenStatusListener>();

  setEnabled(enabled: boolean, port: number): ListenStatus {
    this.enabled = enabled;
    const status = this.getStatus(port, true);
    this.listeners.forEach((listener) => listener(status));
    return status;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  onStatusChange(listener: ListenStatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(port: number, canManage: boolean): ListenStatus {
    return {
      enabled: this.enabled,
      urls: this.enabled ? this.getLanUrls(port) : [],
      port,
      canManage,
    };
  }

  canAccess(method: string, pathname: string, remoteAddress?: string): boolean {
    const isLocal = this.isLocalAddress(remoteAddress);
    if (isLocal) {
      return true;
    }

    if (!this.enabled) {
      return false;
    }

    if (method !== 'GET' && method !== 'HEAD') {
      return false;
    }

    if (!pathname.startsWith('/api/')) {
      return true;
    }

    return pathname === '/api/machines' || pathname === '/api/listen' || pathname === '/api/events';
  }

  isLocalAddress(remoteAddress?: string): boolean {
    if (!remoteAddress) {
      return false;
    }

    const normalized = this.normalizeAddress(remoteAddress);
    if (normalized === '::1' || normalized.startsWith('127.')) {
      return true;
    }

    return this.getLocalAddresses().has(normalized);
  }

  getLanUrls(port: number): string[] {
    return Array.from(this.getLocalAddresses())
      .filter((address) => !address.startsWith('127.'))
      .map((address) => `http://${address}:${port}/`);
  }

  private getLocalAddresses(): Set<string> {
    const addresses = new Set<string>(['127.0.0.1']);
    const interfaces = os.networkInterfaces();

    Object.values(interfaces).forEach((entries) => {
      entries?.forEach((entry) => {
        if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) {
          addresses.add(entry.address);
        }
      });
    });

    return addresses;
  }

  private normalizeAddress(address: string): string {
    if (address.startsWith('::ffff:')) {
      return address.slice('::ffff:'.length);
    }
    return address;
  }
}
