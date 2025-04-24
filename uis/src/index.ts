import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import express from 'express';
import { jsonc } from 'jsonc';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { configureLAN } from './networking';
import dash from './dashboard';
import central from './central';
import { getUsernameFromID, User } from './user';
import { checkForUpdate } from './update';
import { aesEncrypt, generateKeypair, generateSharedKey, sharedKey } from './encryption';
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
// TODO: Actual encrypted messaging and communication
generateKeypair(2048);
generateSharedKey(32, 16);

const messages: { Time: number, Author: string, Text: string, Attachments?: string }[] = [];

export const CENTRAL_SERVER_URL = `http://localhost:${PORTS.Central}`;

// Read config
let config: Config;
try {
  config = jsonc.parse(readFileSync('./config.jsonc', 'utf-8'));
} catch (_err) {
  console.trace(_err);
  process.exit(0);
}

// Read whitelisted users
if (config["Whitelist"]) {
  config["Whitelist-Users"] = readFileSync('whitelist.txt', 'utf-8').split('\n');
}

// If the file isn't the main file which was run
if (require.main !== module) {
  process.exit(0);
}

const app = express();
const server = createServer(app);
const io = new Server(server);

// Hostname configuration depending on the config
// Will always use localhost when Debug Mode is enabled
// Will try to find a LAN IP when Use-Lan is enabled
// TODO: Find a non-LAN IP when Use-Lan and Debug-Mode are both disabled
let hostname: string = 'localhost';
if (config["Use-LAN"] && !config["Debug-Mode"]) hostname = configureLAN();

// Connection URL for clients
const url = `http://${hostname}:${PORTS.User}`;

io.on('connection', async (socket) => {
  // Display a connection message
  const connection_message = `<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} joined`;
  dash.broadcastConsole(connection_message);

  console.log(socket.handshake.query);

  if (!socket.handshake.query.id) {
    dash.broadcastConsole(`<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} was kicked out due to no ID present`);
    socket.disconnect(true);
    return;
  }

  if (typeof socket.handshake.query.id !== typeof "") {
    dash.broadcastConsole(`<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} was kicked out due to unformatted ID`);
    socket.disconnect(true);
    return;
  }

  // ! Typescript is dumb and we know the ID will be a string by that point
  // @ts-ignore
  const ID: string = socket.handshake.query.id;

  // Store user data
  const user: User = {
    username: await getUsernameFromID(ID),
    id: ID,
  }

  // Check whether or not the user is allowed to connect to the UIS
  const { allowed, reason } = dash.authorizeConnection(user);
  if (!allowed) {
    dash.broadcastConsole(`<span class=violet>${getTime()}</span> User ${user.username} was kicked out due to ${reason}`);
    socket.disconnect(true);
    return;
  }

  // If yes, the UIS returns an ID call that confirms their connection
  // And a MSG call that sends all messages on the server
  socket.emit("id", JSON.stringify({ shar: sharedKey.shar, iv: sharedKey.iv }));
  socket.emit("msg", JSON.stringify(messages));

  // Disconnect listener for when the user disconnects by themselves
  socket.on("disconnect", () => {
    const message = `<span class=violet>${getTime()}</span> User ${socket.conn.remoteAddress} left`;
    dash.broadcastConsole(message);
    dash.userDisconnected(user);
  })

  // MSG/PLAIN listener for when the user sends a plain text message
  socket.on('msg/plain', async (_data) => {
    // TODO: Check for when a user sends a message, whether they're actually on the server.
    const data = JSON.parse(_data);
    if (data["Authorization"] == "") return;

    // Adding the message to the list of messages
    const author_id = data["Authorization"];
    const txt = data.Text.replace(/>/g, '\\>').replace(/</g, '\\<');
    const msg = { Time: Date.now(), Author: author_id, Text: aesEncrypt(txt) };
    messages.push(msg);
    // If we can store the messages to disk
    if (config["Allow-Disk-Save"] == true) {
      const file = join(ROOT, 'store/messages.json');
      writeFileSync(file, JSON.stringify(messages));
    }

    dash.broadcastConsole(`<span class=violet>${getTime()}</span> [${author_id}]: ${data.Text}`);

    // Send a MSG call to all connected sockets about the new message that was sent
    socket.emit('msg', JSON.stringify([messages[messages.length - 1]]));
    socket.broadcast.emit('msg', JSON.stringify([messages[messages.length - 1]]));
  });
});

// API endpoint for the Central Server to use when the server is up
// Serves as an anti-purging system
app.get('/s', (req, res) => {
  const STATUS = {
    "Is-Alive": true,
    "Users-Connected": dash.getUsers().length,
  };

  res.status(200).send(JSON.stringify(STATUS));
});

server.listen(PORTS.User, hostname, async () => {
  // Warning spaces
  if (config["Debug-Mode"]) {
    console.log("DEBUG | Entering UIS Debug mode.");
  } else if (hostname == 'localhost') {
    console.log(`WARNING | Node running on localhost. Are you connected to the Internet?`);
  }

  // Allow for central networking only when we are not in Debug Mode
  if (!config["Debug-Mode"]) {
    if (!await central.register(config, hostname)) return;
  }

  // Start up the Dashboard server and check for any updates to the server software on the GitHub repository
  dash.createDashboardServer(ROOT, PORTS, hostname, config);
  checkForUpdate(config["Debug-Mode"], CURRENT_INSTANCE_DATA.version);

  // Open the dashboard webpage
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