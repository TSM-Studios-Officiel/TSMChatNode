import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld('clientapi', {
  connect: async (hostname: string) => {
    const res = await ipcRenderer.invoke('client/connect', [hostname]);
    return res;
  },
  disconnect: async () => {
    const res = await ipcRenderer.invoke('client/disconnect');
    return res;
  },

  getHostname: async () => {
    const { host } = await ipcRenderer.invoke('client/status');
    return host;
  },

  sendMessage: async (contents: string) => {
    ipcRenderer.send('client/send', contents);
  },

  log: (doc: string) => {
    logConsole(doc);
  }
});

ipcRenderer.on('server/message', async (event, args) => {
  logConsole(args);
});

function logConsole(doc: string) {
  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `<span>${lines[i]}</span>`;
  }
  doc = lines.join("");
  const cons = document.querySelector("div#console") ?? document.createElement("div#console");
  cons.innerHTML = `${cons.innerHTML}${doc}`;

  return
}