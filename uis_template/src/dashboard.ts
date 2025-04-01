import { join } from 'node:path';

import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { getTime } from '.';
import { User } from './user';

const app = express();
const server = createServer(app);
const io = new Server(server);

let console_lines: string[] = [];

const online_users: User[] = [];

export function createDashboardServer(ROOT: string, PORTS: { [index: string]: number }, hostname: string) {
  console_lines.push(`<span class=green>${getTime()} Node running on: <a href="http://${hostname}:${PORTS.User}" class=light_blue>http://${hostname}:${PORTS.User}/</a></span>`)

  app.use('/', express.static('./dashboard'));

  io.on('connection', (socket) => {
    debug("Socket connected");
    socket.emit('console', console_lines.join('\n'));
  });

  server.listen(PORTS.Dashboard, () => {
    console.log(`>> UIS Dashboard on: \x1b]8;;http://localhost:${PORTS.Dashboard}\x07http://localhost:${PORTS.Dashboard}\x1b]8;;\x07`);
  });
}

export function userConnected(user: User) {
  online_users.push(user);
  io.emit('userupdate', JSON.stringify(online_users));
}

export function userDisconnected(user: User) {
  const index = online_users.indexOf(user);
  online_users.splice(index, 1);
  io.emit('userupdate', JSON.stringify(online_users));
}

export function broadcastConsole(line: string) {
  console_lines.push(line);
  io.emit('console', line);
}

function debug(...text: any[]) {
  console.log('[[DASHBOARD]] ', ...text);
}

export default {
  userConnected,
  userDisconnected,
  broadcastConsole,
  createDashboardServer,
};