import http, { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { MonitorController, monitorController } from './MonitorController';
import { ListenManager } from './ListenManager';
import { Logger } from '../utils/Logger';
import type { ApiEventMessage, ApiResponse, ListenStatus, MachineInput } from '../shared/api-types';

interface WebServerOptions {
  controller?: MonitorController;
  listenManager?: ListenManager;
  staticDir?: string;
  port?: number;
}

const DEFAULT_PORT = 7890;
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

export function createWebServer(options: WebServerOptions = {}) {
  const controller = options.controller ?? monitorController;
  const listenManager = options.listenManager ?? new ListenManager();
  const staticDir = options.staticDir ?? path.resolve(process.cwd(), 'dist', 'renderer');
  const configuredPort = options.port ?? Number(process.env.PORT || DEFAULT_PORT);
  const clients = new Set<WebSocket>();
  const clientPermissions = new WeakMap<WebSocket, boolean>();

  const server = http.createServer(async (req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = requestUrl.pathname;

    if (!listenManager.canAccess(req.method || 'GET', pathname, req.socket.remoteAddress)) {
      sendForbidden(res, pathname.startsWith('/api/'));
      return;
    }

    try {
      if (pathname.startsWith('/api/')) {
        await handleApiRequest(req, res, pathname, controller, listenManager, configuredPort);
        return;
      }

      await serveStatic(req, res, pathname, staticDir);
    } catch (error) {
      Logger.error('Request failed', { pathname, error });
      sendJson(res, 500, { success: false, error: 'Internal server error' });
    }
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const pathname = requestUrl.pathname;

    if (pathname !== '/api/events' || !listenManager.canAccess('GET', pathname, req.socket.remoteAddress)) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws, req) => {
    const canManage = listenManager.isLocalAddress(req.socket.remoteAddress);
    clients.add(ws);
    clientPermissions.set(ws, canManage);
    sendEvent(ws, {
      type: 'machines:status-update',
      data: { machines: controller.getMachines() },
    });
    sendEvent(ws, {
      type: 'listen:status-update',
      data: listenManager.getStatus(configuredPort, canManage),
    });

    ws.on('close', () => clients.delete(ws));
  });

  const unsubscribeMachines = controller.onMachinesUpdate((machines) => {
    broadcast(clients, {
      type: 'machines:status-update',
      data: { machines },
    });
  });

  const unsubscribeListen = listenManager.onStatusChange((status) => {
    clients.forEach((client) => {
      sendEvent(client, {
        type: 'listen:status-update',
        data: {
          ...status,
          canManage: clientPermissions.get(client) || false,
        },
      });
    });
  });

  return {
    server,
    controller,
    listenManager,
    port: configuredPort,
    close: () =>
      new Promise<void>((resolve, reject) => {
        unsubscribeMachines();
        unsubscribeListen();
        wss.close();
        clients.forEach((client) => client.close());
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

export async function startWebServer(): Promise<void> {
  monitorController.initialize();

  const host = process.env.HOST || '0.0.0.0';
  const webServer = createWebServer();

  webServer.server.listen(webServer.port, host, () => {
    Logger.info('ComfyUI Monitor web server started', {
      localUrl: `http://127.0.0.1:${webServer.port}/`,
      host,
      port: webServer.port,
    });
    console.log(`ComfyUI Monitor: http://127.0.0.1:${webServer.port}/`);
  });

  process.on('SIGINT', async () => {
    await webServer.close();
    monitorController.dispose();
    process.exit(0);
  });
}

async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  controller: MonitorController,
  listenManager: ListenManager,
  port: number
): Promise<void> {
  const method = req.method || 'GET';
  const localRequest = listenManager.isLocalAddress(req.socket.remoteAddress);

  if (method === 'GET' && pathname === '/api/machines') {
    sendJson(res, 200, { success: true, data: { machines: controller.getMachines() } });
    return;
  }

  if (method === 'POST' && pathname === '/api/machines') {
    const input = await readJson<MachineInput>(req);
    const machine = controller.addMachine(input);
    sendJson(res, 201, { success: true, data: { machine } });
    return;
  }

  if (method === 'POST' && pathname === '/api/machines/connect-all') {
    const count = controller.connectAll();
    sendJson(res, 200, { success: true, data: { count } });
    return;
  }

  if (method === 'POST' && pathname === '/api/machines/disconnect-all') {
    controller.disconnectAll();
    sendJson(res, 200, { success: true, data: {} });
    return;
  }

  const machineActionMatch = pathname.match(/^\/api\/machines\/([^/]+)\/(connect|disconnect)$/);
  if (method === 'POST' && machineActionMatch) {
    const [, id, action] = machineActionMatch;
    const found = action === 'connect' ? controller.connectMachine(id) : controller.disconnectMachine(id);
    if (!found) {
      sendJson(res, 404, { success: false, error: 'Machine not found' });
      return;
    }
    sendJson(res, 200, { success: true, data: {} });
    return;
  }

  const machineMatch = pathname.match(/^\/api\/machines\/([^/]+)$/);
  if (machineMatch) {
    const id = machineMatch[1];

    if (method === 'PATCH') {
      const body = await readJson<{ updates: Partial<MachineInput> }>(req);
      const machine = controller.updateMachine(id, body.updates || {});
      if (!machine) {
        sendJson(res, 404, { success: false, error: 'Machine not found' });
        return;
      }
      sendJson(res, 200, { success: true, data: { machine } });
      return;
    }

    if (method === 'DELETE') {
      const removed = controller.removeMachine(id);
      if (!removed) {
        sendJson(res, 404, { success: false, error: 'Machine not found' });
        return;
      }
      sendJson(res, 200, { success: true, data: { removed: true } });
      return;
    }
  }

  if (method === 'GET' && pathname === '/api/notion/config') {
    sendJson(res, 200, { success: true, data: controller.getNotionConfigStatus() });
    return;
  }

  if (method === 'POST' && pathname === '/api/notion/config') {
    const body = await readJson<{ token: string; databaseId: string }>(req);
    controller.setNotionConfig(body.token, body.databaseId);
    sendJson(res, 200, { success: true, data: {} });
    return;
  }

  if (method === 'POST' && pathname === '/api/notion/test-connection') {
    const result = await controller.testNotionConnection();
    sendJson(res, 200, result.success ? { success: true, data: {} } : { success: false, error: result.error || 'Connection test failed' });
    return;
  }

  if (method === 'DELETE' && pathname === '/api/notion/config') {
    controller.clearNotionConfig();
    sendJson(res, 200, { success: true, data: {} });
    return;
  }

  if (method === 'GET' && pathname === '/api/listen') {
    sendJson(res, 200, { success: true, data: listenManager.getStatus(port, localRequest) });
    return;
  }

  if (method === 'POST' && pathname === '/api/listen') {
    const body = await readJson<{ enabled: boolean }>(req);
    const status = listenManager.setEnabled(Boolean(body.enabled), port);
    sendJson(res, 200, { success: true, data: status });
    return;
  }

  sendJson(res, 404, { success: false, error: 'Not found' });
}

async function serveStatic(req: IncomingMessage, res: ServerResponse, pathname: string, staticDir: string): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    sendText(res, 405, 'Method not allowed');
    return;
  }

  const decodedPath = decodeURIComponent(pathname);
  const requestedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(staticDir, safePath);

  if (!filePath.startsWith(staticDir)) {
    sendText(res, 403, 'Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(staticDir, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    sendText(res, 404, 'Build output not found. Run npm run build:web first.');
    return;
  }

  res.writeHead(200, { 'Content-Type': getContentType(filePath) });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  fs.createReadStream(filePath).pipe(res);
}

function sendJson<T>(res: ServerResponse, status: number, payload: ApiResponse<T>): void {
  res.writeHead(status, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function sendText(res: ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(message);
}

function sendForbidden(res: ServerResponse, isApi: boolean): void {
  if (isApi) {
    sendJson(res, 403, { success: false, error: 'LAN listening is disabled or this action is local-only' });
    return;
  }
  sendText(res, 403, 'LAN listening is disabled. Enable monitoring share from the host computer first.');
}

function readJson<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : ({} as T));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function broadcast(clients: Set<WebSocket>, message: ApiEventMessage): void {
  clients.forEach((client) => sendEvent(client, message));
}

function sendEvent(ws: WebSocket, message: ApiEventMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getContentType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.ico':
      return 'image/x-icon';
    default:
      return 'application/octet-stream';
  }
}

if (require.main === module) {
  startWebServer().catch((error) => {
    Logger.error('Failed to start web server', error);
    process.exit(1);
  });
}
