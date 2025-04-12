import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import client_socket from './socket';

const ROOT = join(__dirname, "..");

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('public/index.html');
}

ipcMain.handle('client/connect', async (event, args) => {
  return client_socket.connect(args[0]);
});

ipcMain.handle('client/disconnect', async (event, args) => {
  return client_socket.disconnect();
});

ipcMain.handle('client/status', async (event, args) => {
  return client_socket.STATUS;
});

ipcMain.on('client/send', async (event, args) => {
  return client_socket.send(args);
})

export function receiveMessages(data: any) {
  ipcMain.emit('server/message', data);
}

app.whenReady().then(() => {
  createWindow();
});