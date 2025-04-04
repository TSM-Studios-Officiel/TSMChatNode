import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import express from 'express';
import { jsonc } from 'jsonc';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { configureLAN } from './networking';
import dash from './dashboard';
import { User } from './user';
const OPN_PRM = import('open').then((v) => v);

const PORTS = {
  User: 48025,
  Dashboard: 48026,
  Central: 48027,
};

const ROOT = join(__dirname, '../');

let config: Config;
try {
  config = jsonc.parse(readFileSync('./config.jsonc', 'utf-8'));
} catch (_err) {
  console.trace(_err);
  process.exit(0);
}

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
if (config["Use-LAN"] && !config["Debug-Mode"]) hostname = configureLAN();

const url = `http://${hostname}:${PORTS.User}`;

io.on('connection', (socket) => {
  const connection_message = `<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} joined`;
  console.log(connection_message);
  dash.broadcastConsole(connection_message);
  const user: User = {
    username: socket.conn.remoteAddress,
  }
  dash.userConnected(user);

  socket.on("disconnect", () => {
    const message = `<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} left`;
    dash.broadcastConsole(message);
    dash.userDisconnected(user);
  })
});

app.get('/s', (req, res) => {
  const STATUS = {
    "Is-Alive": true,
    "Users-Connected": dash.getUsers().length,
  };

  res.status(200).send(JSON.stringify(STATUS));
});

app.use('/c/', express.static(join(ROOT, 'public')));

server.listen(PORTS.User, hostname, () => {
  if (config["Debug-Mode"]) {
    console.log("DEBUG | Entering UIS Debug mode.");
  } else if (hostname == 'localhost') {
    console.log(`WARNING | Node running on localhost. Are you connected to the Internet?`);
  }

  dash.createDashboardServer(ROOT, PORTS, hostname);
  OPN_PRM.then((opn) => opn.openApp(`http://localhost:${PORTS.Dashboard}`));
});

export function getTime() {
  const time = new Date(Date.now());
  const format = `[${time.toLocaleString('fr-FR')}]`;
  return format;
}

export interface Config {
  "Use-LAN": boolean,
  "Allow-Listing": boolean,
  "Whitelist": boolean,
  "Max-Concurrent-Users": number,
  "Allow-Disk-Save": boolean,
  "Message-Character-Limit": number,
  "Allow-Media": boolean,
  "Media-Size-Limit": number,
  "Ephemeral-Messages": number,
  "Debug-Mode": boolean,

  "Whitelist-Users": string[],
};