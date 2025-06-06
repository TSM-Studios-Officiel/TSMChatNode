import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { getTime, Config } from '.';
import { User } from './user';

const app = express();
const server = createServer(app);
const io = new Server(server);

let console_lines: string[] = [];

let CONFIG: Config;
const online_users: User[] = [];


export function createDashboardServer(ROOT: string, PORTS: { [index: string]: number }, hostname: string, _CFG: Config) {
  CONFIG = _CFG;
  console_lines.push(`<span class=violet>${getTime()} Node running on: <a href="http://${hostname}:${PORTS.User}/" style='color: white'>http://${hostname}:${PORTS.User}/</a></span>`)

  app.use('/', express.static('./dashboard'));

  io.on('connection', (socket) => {
    debug("Socket connected");
    socket.emit("init", JSON.stringify(CONFIG));
    socket.emit('console', console_lines.join('\n'));

    socket.on('stop', (arg) => {
      handleStop(arg);
    });

  });

  server.listen(PORTS.Dashboard, () => {
    console.log(`>> UIS Dashboard on: \x1b]8;;http://localhost:${PORTS.Dashboard}\x07http://localhost:${PORTS.Dashboard}\x1b]8;;\x07`);
  });
}

// Checks for any reason to disconnect a user
export function authorizeConnection(user: User): { allowed: boolean, reason: string } {
  if (online_users.length >= CONFIG["Max-Concurrent-Users"]) return { allowed: false, reason: "User limit reached" };

  const username = user.username;
  if (username == "") return { allowed: false, reason: "Who are you?" };

  if (CONFIG["Whitelist"]) {
    if (!CONFIG["Whitelist-Users"].includes(username)) return { allowed: false, reason: "You are not whitelisted on this server" };
  }

  online_users.push(user);
  io.emit('userupdate', JSON.stringify(online_users));

  return { allowed: true, reason: "" };
}

export function getUsernameFromServerID(identifier: string): string {
  for (const user of online_users) {
    if (user.id == identifier) return user.username;
  }

  return "";
}

export function userDisconnected(user: User) {
  const index = online_users.indexOf(user);
  online_users.splice(index, 1);
  io.emit('userupdate', JSON.stringify(online_users));
}

export function getUsers() {
  return online_users;
}

export function broadcastConsole(line: string) {
  console_lines.push(line);
  io.emit('console', line);
}

function debug(...text: any[]) {
  console.log('[[DASHBOARD]] ', ...text);
}

function handleStop(time: number) {
  debug("Socket called for server signal interrupt");
  let i = time;
  setInterval(() => {
    if (i > 0) broadcastConsole(`<span class=violet>${getTime()}</span> <span class=red>Server shutting down in ${i} seconds</span>`);
    if (i == 0) {
      broadcastConsole(`<span class=violet>${getTime()}</span> <span class=red>Server shutting down NOW!</span>`);
      setTimeout(() => process.exit(0), 1000);
    };
    i--;
  }, 1000);
}

export default {
  authorizeConnection,
  userDisconnected,
  broadcastConsole,
  createDashboardServer,
  getUsers,
};