import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import open from 'open';
import { jsonc } from 'jsonc';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { configurateLAN as configureLAN } from './networking';
import dash from './dashboard';
import { User } from './user';

const PORTS = {
  User: 48025,
  Dashboard: 48026,
  Central: 48027,
};

const ROOT = join(__dirname, '../');

let config;
try {
  config = jsonc.parse(readFileSync('./config.jsonc', 'utf-8'));
} catch (_err) {
  console.trace(_err);
}

if (config["Whitelist"]) {
  config["Whitelist-Users"] = readFileSync('whitelist.txt', 'utf-8').split('\n');
}

if (require.main !== module) {
  process.exit(0);
}

const server = createServer();
const io = new Server(server);

let hostname: string = 'localhost';
if (config["Use-LAN"]) hostname = configureLAN();

const url = `http://${hostname}:${PORTS.User}`;

io.on('connection', (socket) => {
  const connection_message = `${getTime()} User ${socket.conn.remoteAddress} joined`;
  console.log(connection_message);
  dash.broadcastConsole(connection_message);
  const user: User = {
    username: socket.conn.remoteAddress,
  }
  dash.userConnected(user);

  socket.on("disconnect", () => {
    const message = `${getTime()} User ${socket.conn.remoteAddress} left`;
    dash.broadcastConsole(message);
    dash.userDisconnected(user);
  })
});

server.listen(PORTS.User, hostname, () => {
  if (hostname == 'localhost') {
    console.log(`WARNING | Node running on localhost. Are you connected to the Internet?`);
  }

  dash.createDashboardServer(ROOT, PORTS, hostname);
  open(`http://localhost:${PORTS.Dashboard}`);
});

export function getTime() {
  const time = new Date(Date.now());
  const format = `[${time.toLocaleString('fr-FR')}]`;
  return format;
}