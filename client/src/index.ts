import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { join } from 'node:path';
import axios from 'axios';
import client_socket from './socket';
import { aesDecrypt, generateKeypair, generateSharedKey, keypair, rsaDecrypt, rsaEncrypt, sharedKey } from './encryption';

const CENTRAL_SERVER_URL = "http://localhost:48027"
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

ipcMain.handle('status/signup', async (event, args) => {
  const key_data = await axios({
    method: 'get',
    url: CENTRAL_SERVER_URL + '/pem'
  });
  const key = key_data.data;

  const obj = {
    username: rsaEncrypt(key, args[0]),
    password: rsaEncrypt(key, args[1]),
    aes: rsaEncrypt(key, JSON.stringify(sharedKey)),
  };

  // We are expecting an AES-encrypted JWT
  try {
    const res = await axios({
      method: 'post',
      url: CENTRAL_SERVER_URL + '/signup',
      headers: {
        'Content-Type': 'application/json'
      },
      data: obj
    });

    // TODO: Get the data of the response and store it encrypted as our current authentication token.
    if (res.status == 200) {
      SESSION_ID = aesDecrypt(res.data);
      mainWindow.webContents.send("log", "Account created and connected.");
    }
  } catch (_) {
    mainWindow.webContents.send("log", "An error occurred during sign up.");
  }

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
  generateSharedKey(32, 16);
}