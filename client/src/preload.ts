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
    const STATUS = await ipcRenderer.invoke('client/status');
    console.log(STATUS);
    return STATUS.host;
  },

  sendMessage: async (contents: string) => {
    ipcRenderer.send('client/send', contents);
  },

  sendMedias: async (paths: string[]) => {
    ipcRenderer.send('client/media', paths);
  },

  signin: async (username: string, password: string) => {
    // @ts-ignore
    const fail_text: Element = document.querySelector(".signin_dialog")?.querySelector(".fail_text");
    fail_text.textContent = "";
    const res = await ipcRenderer.invoke('status/signin', [username, password]);
  },

  signup: async (username: string, password: string) => {
    // @ts-ignore
    const fail_text: Element = document.querySelector(".signup_dialog")?.querySelector(".fail_text");
    fail_text.textContent = "";
    const res = await ipcRenderer.invoke('status/signup', [username, password]);
  },

  showListing: async () => {
    ipcRenderer.send('list/main');
  },

  scanLAN: async () => {
    ipcRenderer.send('list/lan');
  },

  log: (doc: string) => {
    logConsole(doc);
  },

  registerServer: async (hostname: string, detail: string) => {
    const res = await ipcRenderer.invoke('client/save', { hostname, detail });

    logConsole(res);
  },

  seeRegisteredServers: async () => {
    const res = await ipcRenderer.invoke('client/see-saved');

    for (const server of res) {
      logConsole(`  <span class=blue>${server.hostname}</span>: ${server.detail}`);
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.on("server/message", async (_, _data) => {
    const data = JSON.parse(_data);
    let exploitableData: any[];
    if (typeof data != typeof []) {
      exploitableData = [data];
    } else {
      exploitableData = data;
    }

    const STATUS = await ipcRenderer.invoke('client/status');

    for (const item of exploitableData) {
      const time_sent = new Date(item.Time).toLocaleString();
      const author = item.Author;
      const text = item.Text;
      const attachments = item.Attachments;

      let attachment_str = "<br/>";
      for (const attachment of attachments) {
        const tmp = attachment.split('.');
        const type = tmp[tmp.length - 1];

        const url = `http://${STATUS.host}:48025/attachment/${attachment}`;

        console.log(`Displaying ${type}: /attachment/${attachment}`);

        switch (type) {
          // Images
          case "png":
          case "jpg":
          case "jpeg": {
            attachment_str += `<img class=attachment src="${url}"></img><br/>`;
            break;
          }

          default: {
            attachment_str += `<a href="${url}">Attachment</a><br/>`;
            break;
          }
        }
      }

      const str = `<span class=violet>[${time_sent}]</span> [${author}]: ${text}${attachment_str}`;
      // ! When logging to the console, the input bar doesn't stick to the bottom of the screen and instead scrolls with the rest of the text
      // TODO: FIX IT
      logConsole(str);
    }
  })

  ipcRenderer.on("server/connected", (_, data) => {
    clearTimeout(connection_timeout);
    logConsole(`<span class=green>Connected to ${data}</span>`);
  })

  ipcRenderer.on("log", (_, data) => {
    logConsole(data);
  })

  ipcRenderer.on("err/console", (_, data) => {
    console.error(data);
  })

  ipcRenderer.on("client/signup/ok", () => {
    const signup_dialog = document.querySelector(".signup_dialog");
    signup_dialog?.setAttribute("isopened", "false");
    signup_dialog?.removeAttribute("open");
  })

  ipcRenderer.on("client/signup/fail", (_, data: string) => {
    const signup_dialog = document.querySelector(".signup_dialog");
    // ! Typescript is shit when it comes to handling html data
    // @ts-ignore
    const fail_text: Element = signup_dialog.querySelector("span.fail_text");
    fail_text.textContent = data;
  })

  ipcRenderer.on("client/signin/ok", () => {
    const signin_dialog = document.querySelector(".signin_dialog");
    signin_dialog?.setAttribute("isopened", "false");
    signin_dialog?.removeAttribute("open");
  })

  ipcRenderer.on("client/signin/fail", (_, data: string) => {
    const signin_dialog = document.querySelector(".signin_dialog");
    // ! Typescript is shit when it comes to handling html data
    // @ts-ignore
    const fail_text: Element = signin_dialog.querySelector("span.fail_text");
    fail_text.textContent = data;
  })

  ipcRenderer.on('error/client', (_, reason: string) => {
    logConsole(`<span class=red>${reason}</span>`);
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