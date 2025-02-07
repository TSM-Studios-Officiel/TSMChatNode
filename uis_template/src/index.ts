const config = require('../config.json.js');
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { configurateLAN } from './networking';
import dash from './dashboard';

const PORTS = {
  User: 48025,
  Dashboard: 48026,
  Central: 48027,
};

const ROOT = join(__dirname, '../');

if (config["Whitelist"]) {
  config["Whitelist-Users"] = readFileSync('whitelist.txt', 'utf-8').split('\n');
}

if (require.main !== module) {
  process.exit(0);
}


const app = express();
const server = createServer(app);
const io = new Server(server);



let hostname: string = 'localhost';
if (config["Use-LAN"]) hostname = configurateLAN();

const url = `http://${hostname}:${PORTS.User}`;

app.get('/', (req: Request, res: Response) => {
  res.sendFile(join(ROOT, 'public/index.html'));
});

io.on('connection', (socket) => {
  const connection_message = `${getTime()} User ${socket.conn.remoteAddress} joined`;
  console.log(connection_message);
  dash.broadcastConsole(connection_message);

  socket.on("disconnect", () => {
    const message = `${getTime()} User ${socket.conn.remoteAddress} left`;
    console.log(message);
    dash.broadcastConsole(message);
  })
});

server.listen(PORTS.User, hostname, () => {
  console.log(`>> UIS running on: \x1b]8;;${url}\x07${url}\x1b]8;;\x07`);
  if (hostname == 'localhost') {
    console.log(`WARNING | UIS running on localhost. Are you connected to the Internet?`);
  }

  dash.createDashboardServer(ROOT, PORTS.Dashboard);
});

function getTime() {
  const time = new Date(Date.now());
  const format = `[${time.toLocaleString('fr-FR')}]`;
  return format;
}