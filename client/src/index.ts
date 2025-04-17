import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import client_socket from './socket';
import { generateKeypair } from './encryption';

const ROOT = join(__dirname, "..");
let mainWindow: BrowserWindow;

let SESSION_ID = "";

const createWindow = () => {
  prereqs();

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile('public/index.html');
}

ipcMain.handle('client/connect', async (event, args) => {
  client_socket.connect(args[0]);
});

ipcMain.handle('client/disconnect', async (event, args) => {
  client_socket.disconnect();
});

ipcMain.handle('client/status', async (event, args) => {
  return client_socket.STATUS;
});

ipcMain.on('client/send', async (event, args) => {
  return client_socket.send(args);
})

export function receiveMessages(data: string) {
  console.log(data);
  mainWindow.webContents.send('server/message', data);
}

export function affirmConnection(data: string) {
  mainWindow.webContents.send('server/connected', data);
}

app.whenReady().then(() => {
  createWindow();
});

/**
 * The Prerequisite functions, ran on startup but before any window is displayed.
 */
function prereqs() {
  // Generate unique session encryption keys
  generateKeypair(2048);
}