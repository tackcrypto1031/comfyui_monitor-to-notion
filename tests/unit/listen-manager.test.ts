import { describe, expect, it } from 'vitest';
import { ListenManager } from '../../src/server/ListenManager';

describe('ListenManager', () => {
  it('allows local requests regardless of listen state', () => {
    const manager = new ListenManager();

    expect(manager.canAccess('POST', '/api/machines', '127.0.0.1')).toBe(true);
    expect(manager.canAccess('POST', '/api/listen', '::ffff:127.0.0.1')).toBe(true);
  });

  it('blocks LAN requests while listen mode is disabled', () => {
    const manager = new ListenManager();

    expect(manager.canAccess('GET', '/', '192.0.2.10')).toBe(false);
    expect(manager.canAccess('GET', '/api/machines', '192.0.2.10')).toBe(false);
  });

  it('allows only read-only LAN routes while listen mode is enabled', () => {
    const manager = new ListenManager();
    manager.setEnabled(true, 7890);

    expect(manager.canAccess('GET', '/', '192.0.2.10')).toBe(true);
    expect(manager.canAccess('GET', '/assets/app.js', '192.0.2.10')).toBe(true);
    expect(manager.canAccess('GET', '/api/machines', '192.0.2.10')).toBe(true);
    expect(manager.canAccess('GET', '/api/listen', '192.0.2.10')).toBe(true);
    expect(manager.canAccess('GET', '/api/events', '192.0.2.10')).toBe(true);

    expect(manager.canAccess('GET', '/api/notion/config', '192.0.2.10')).toBe(false);
    expect(manager.canAccess('POST', '/api/machines', '192.0.2.10')).toBe(false);
    expect(manager.canAccess('POST', '/api/listen', '192.0.2.10')).toBe(false);
  });
});
