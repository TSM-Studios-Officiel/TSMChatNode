import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import express from 'express';
import { jsonc } from 'jsonc';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { configureLAN } from './networking';
import dash from './dashboard';
import central from './central';
import { User } from './user';
import { checkForUpdate } from './update';
import { generateKeypair, generateSharedKey } from './encryption';
const OPN_PRM = import('open').then((v) => v);

const PORTS = {
  User: 48025,
  Dashboard: 48026,
  Central: 48027,
};

const ROOT = join(__dirname, '../');

const CURRENT_INSTANCE_DATA: InstData = JSON.parse(readFileSync('./data.json', "utf-8"));

// Generate keys for symmetric and asymmetric encryption
// Asymmetric encryption will be used by connecting clients requesting data from the server
// Symmetric encryption will be used by connected clients for message sending and receiving
generateKeypair(2048);
generateSharedKey(32, 16);

const messages: { Time: number, Author: string, Text: string, Attachments?: string }[] = [];

export const CENTRAL_SERVER_URL = `http://localhost:${PORTS.Central}`;

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
  dash.broadcastConsole(connection_message);
  const user: User = {
    username: socket.conn.remoteAddress,
  }
  const { allowed, reason } = dash.userConnected(user);
  if (!allowed) {
    dash.broadcastConsole(`<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} was kicked out due to ${reason}`);
    socket.disconnect();
    return;
  }

  socket.emit("id", socket.conn.remoteAddress);
  socket.emit("msg", JSON.stringify(messages));

  socket.on("disconnect", () => {
    const message = `<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} left`;
    dash.broadcastConsole(message);
    dash.userDisconnected(user);
  })

  socket.on('msg/plain', (_data) => {
    const data = JSON.parse(_data);
    if (data["Authorization"] == "") return;

    let file;
    const author_id = data["Authorization"];
    messages.push({ Time: Date.now(), Author: author_id, Text: data.Text.replace(/>/g, '\\>').replace(/</g, '\\<') });
    if (config["Allow-Disk-Save"] == true) {
      file = join(ROOT, 'store/messages.json');
      writeFileSync(file, JSON.stringify(messages));
    }

    dash.broadcastConsole(`<span class=violet>${getTime()}</span> [${author_id}]: ${data.Text}`);

    socket.emit('msg', JSON.stringify([messages[messages.length - 1]]));
    socket.broadcast.emit('msg', JSON.stringify([messages[messages.length - 1]]));
  });
});

app.get('/s', (req, res) => {
  const STATUS = {
    "Is-Alive": true,
    "Users-Connected": dash.getUsers().length,
  };

  res.status(200).send(JSON.stringify(STATUS));
});

server.listen(PORTS.User, hostname, async () => {
  if (config["Debug-Mode"]) {
    console.log("DEBUG | Entering UIS Debug mode.");
  } else if (hostname == 'localhost') {
    console.log(`WARNING | Node running on localhost. Are you connected to the Internet?`);
  }

  if (!await central.register(config, hostname)) return;

  dash.createDashboardServer(ROOT, PORTS, hostname, config);
  checkForUpdate(config["Debug-Mode"], CURRENT_INSTANCE_DATA.version);

  OPN_PRM.then((opn) => opn.openApp(`http://localhost:${PORTS.Dashboard}`));
});

export function getTime() {
  const time = new Date(Date.now());
  const format = `[${time.toLocaleString('fr-FR')}]`;
  return format;
}

export function getDate() {
  const time = new Date(Date.now());
  const format = `${time.getDay()}-${time.getMonth()}-${time.getFullYear()}`;
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

  "Customization": {
    "Server-Name": string,
    "Server-Description": string,
  }

  "Whitelist-Users": string[],
};

export interface InstData {
  "version": string,
}