import { join } from 'node:path';

import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';

const app = express();
const server = createServer(app);
const io = new Server(server);

export function createDashboardServer(ROOT: string, PORT: number) {
  // app.get('/', (req: Request, res: Response) => {
  //   res.sendFile(join(ROOT, 'dashboard/index.html'));
  // });

  app.use('/', express.static('./dashboard'));

  io.on('connection', (socket) => {
    debug("Socket connected");
  });

  server.listen(PORT, () => {
    console.log(`>> UIS Dashboard on: \x1b]8;;http://localhost:${PORT}\x07http://localhost:${PORT}\x1b]8;;\x07`);
  });
}

export function broadcastConsole(line: string) {
  io.emit('console', line);
}

function debug(...text: any[]) {
  console.log('[[DASHBOARD]] ', ...text);
}

export default {
  broadcastConsole,
  createDashboardServer,
};