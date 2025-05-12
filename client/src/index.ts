import { app, BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { join } from 'node:path';
import axios from 'axios';
import client_socket from './socket';
import { aesDecrypt, generateKeypair, generateSharedKey, keypair, rsaDecrypt, rsaEncrypt, sharedKey } from './encryption';
import { existsSync, mkdirSync } from 'node:fs';

const CENTRAL_SERVER_URL = "http://localhost:48027"
const ROOT = join(__dirname, "..");
let mainWindow: BrowserWindow;

export let SESSION_ID = "";

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

  let res: axios.AxiosResponse<any, any>;
  // We are expecting an AES-encrypted token
  try {
    res = await axios({
      method: 'post',
      url: CENTRAL_SERVER_URL + '/signup',
      headers: {
        'Content-Type': 'application/json'
      },
      data: obj
    });

    if (res.data.b == "OK") {
      SESSION_ID = rsaEncrypt(key, aesDecrypt(res.data.a));
      mainWindow.webContents.send("log", "Account created and connected.");
      mainWindow.webContents.send("client/signup/ok");
    } else {
      mainWindow.webContents.send("log", "An error occurred during sign up.");
      mainWindow.webContents.send("client/signup/fail", res.data.a);
    }
  } catch (_) {
  }
});

ipcMain.handle('status/signin', async (event, args) => {
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

  let res: axios.AxiosResponse<any, any>;
  // We are expecting an AES-encrypted token
  try {
    res = await axios({
      method: 'post',
      url: CENTRAL_SERVER_URL + '/signin',
      headers: {
        'Content-Type': 'application/json'
      },
      data: obj
    });

    if (res.data.b == "OK") {
      SESSION_ID = rsaEncrypt(key, aesDecrypt(res.data.a));
      mainWindow.webContents.send("log", "Connected.");
      mainWindow.webContents.send("client/signin/ok");
    } else {
      mainWindow.webContents.send("log", "An error occurred during sign in.");
      mainWindow.webContents.send("client/signin/fail", res.data.a);
    }
  } catch (_) {
  }

});

ipcMain.on('list/main', async () => {
  let hostnames = [];
  try {
    const res = await axios({
      method: 'get',
      url: CENTRAL_SERVER_URL + '/servers',
    });

    hostnames = res.data;
  } catch (_) {
    mainWindow.webContents.send('log', `<span class=red>An error occurred while listing servers`);
    return;
  }

  console.log(`Found ${hostnames.length} servers`);

  for (const hostname of hostnames) {
    console.log(`Pinging http://${hostname}:48025/s`);
    axios({
      method: 'get',
      url: `http://${hostname}:48025/s`,
      timeout: 5000,
    }).then((res) => {
      const data = res.data;

      if (data["Is-UIS"]) {
        console.log(`${hostname} is a valid UIS server`);
        const srv = {
          users: data["Users-Connected"],
          name: data["Name"],
          description: data["Description"],
          whitelisted: data["Whitelisted"],
        }

        const MESSAGE = `<span class=red>${srv.name}</span>: ${srv.description}<br/><span class=green>Whitelisted?: ${srv.whitelisted}</span><br/><span class=blue>Access via <span class=blue style="text-decoration: underline">!connect ${hostname}</span></span><br/>`
        mainWindow.webContents.send('log', MESSAGE);
      }

    }).catch(() => { }); // ignore
  }
});

// TODO: make this actually a good system for lan scanning
// TODO: because it currently only looks for the 256 addresses on 192.168.1.x
ipcMain.on('list/lan', async () => {
  const networkURL = `192.168.1`;

  for (let i = 0; i < 255; i++) {
    console.log(`Pinging http://${networkURL}.${i}:48025/s`);
    axios({
      method: 'get',
      url: `http://${networkURL}.${i}:48025/s`,
      timeout: 5000,
    }).then((res) => {
      const data = res.data;

      if (data["Is-UIS"]) {
        console.log(`${networkURL}.${i} is a valid UIS server`);
        const srv = {
          users: data["Users-Connected"],
          name: data["Name"],
          description: data["Description"],
          whitelisted: data["Whitelisted"],
        }

        const MESSAGE = `<span class=red>${srv.name}</span>: ${srv.description}<br/><span class=green>Whitelisted?: ${srv.whitelisted}</span><br/><span class=blue>Access via <span class=blue style="text-decoration: underline">!connect ${networkURL}.${i}</span></span><br/>`
        mainWindow.webContents.send('log', MESSAGE);
      }

    }).catch(() => { }); // ignore
  }
});

ipcMain.on('client/send', async (event, args) => {
  return client_socket.send(args);
})

export function receiveMessages(data: string) {
  mainWindow.webContents.send('server/message', data);
}

export function affirmConnection(data: string) {
  mainWindow.webContents.send('server/connected', data);
}

export function clientError(reason: string) {
  mainWindow.webContents.send('error/client', reason);
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', async () => {
  quit();
  app.quit();
})

/**
 * The Prerequisite functions, ran on startup but before any window is displayed.
 */
function prereqs() {
  if (!existsSync('./data')) mkdirSync('./data');
  if (!existsSync('./data/keys')) mkdirSync('./data/keys');
  if (!existsSync('./data/user')) mkdirSync('./data/user');

  // Generate unique session encryption keys
  generateKeypair(2048);
  generateSharedKey(32, 16);
}

async function quit() {
  const key_data = await axios({
    method: 'get',
    url: CENTRAL_SERVER_URL + '/pem'
  });
  const key = key_data.data;

  const id = SESSION_ID;

  await axios({
    method: 'post',
    url: CENTRAL_SERVER_URL + '/disconnect',
    data: { id },
  });
}

process.on("SIGINT", async () => {
  await quit()
})
