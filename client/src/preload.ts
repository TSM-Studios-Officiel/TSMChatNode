import { contextBridge, ipcRenderer } from "electron";

let connection_timeout: NodeJS.Timeout;

contextBridge.exposeInMainWorld('clientapi', {
  connect: async (hostname: string) => {
    const res = await ipcRenderer.invoke('client/connect', [hostname]);
    connection_timeout = setTimeout(() => {
      logConsole(`<span class=red>Could not connect to ${hostname}</span>`)
      ipcRenderer.invoke('client/disconnect');
    }, 5000);
    return res;
  },
  disconnect: async () => {
    await ipcRenderer.invoke('client/disconnect');
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
  },
});

window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("server/message", (_, _data) => {
    const data = JSON.parse(_data);
    let exploitableData: any[];
    if (typeof data != typeof []) {
      exploitableData = [data];
    } else {
      exploitableData = data;
    }

    for (const item of exploitableData) {
      const time_sent = new Date(item.Time).toLocaleString();
      const author = item.Author;
      const text = item.Text;

      const str = `<span class=violet>[${time_sent}]</span> [${author}]: ${text}`;
      logConsole(str);
    }
  })

  ipcRenderer.on("server/connected", (_, data) => {
    clearTimeout(connection_timeout);
    logConsole(`<span class=green>Connected to ${data}</span>`);
  })
})

function logConsole(doc: string) {
  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `<span>${lines[i]}</span>`;
  }
  doc = lines.join("");
  const cons = document.querySelector("div#console") ?? document.createElement("div#console");
  cons.innerHTML = `${cons.innerHTML}${doc}`;
}