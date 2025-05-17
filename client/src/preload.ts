import { contextBridge, ipcRenderer } from "electron";

let connection_timeout: NodeJS.Timeout;

contextBridge.exposeInMainWorld('clientapi', {
  connect: async (hostname: string) => {
    const server_span = document.querySelector("span#connected_server") ?? document.createElement("span");
    server_span.textContent = hostname;

    const res = await ipcRenderer.invoke('client/connect', [hostname]);
    connection_timeout = setTimeout(() => {
      logConsole(`<span class=red>Could not connect to ${hostname}</span>`)
      ipcRenderer.invoke('client/disconnect');
      server_span.textContent = "none";
    }, 5000);
    return res;
  },
  disconnect: async () => {
    const server_span = document.querySelector("span#connected_server") ?? document.createElement("span");
    server_span.textContent = "none";
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
    displayRegisteredServers();
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

  ipcRenderer.on('list-complete/all', (_, server: { users: string, name: string, description: string, whitelisted: boolean, hostname: string }) => {
    console.log(server);

    const servers_div = document.querySelector("div#all") ?? document.createElement("div");

    const element = document.createElement("div");
    element.classList.add("server__");

    const NAME_DESC = document.createElement("div");
    NAME_DESC.classList.add("name_desc");

    const title = document.createElement("span");
    title.classList.add("title");
    title.textContent = server.name;

    const description = document.createElement("span");
    description.classList.add("description");
    description.textContent = server.description;

    NAME_DESC.appendChild(title);
    NAME_DESC.appendChild(description);

    const INFO = document.createElement("div");
    INFO.classList.add("info");

    const whitelist = document.createElement("span");
    whitelist.classList.add("whitelist");
    if (server.whitelisted) whitelist.textContent = "Restricted access";

    const users = document.createElement("span");
    users.classList.add("users");
    users.textContent = server.users;

    INFO.appendChild(whitelist);
    INFO.appendChild(users);

    const hostname = document.createElement("button");
    hostname.textContent = server.hostname + ' (Click here to copy)';
    hostname.addEventListener("click", () => {
      const input = document.querySelector("input#srvco");
      // @ts-ignore
      input.value = server.hostname;
    });

    element.append(NAME_DESC);
    element.append(INFO);
    element.append(hostname);

    servers_div.append(element);
  });

  ipcRenderer.on('list-complete/lan', (_, server: { users: string, name: string, description: string, whitelisted: boolean, hostname: string }) => {
    console.log(server);

    const lan_div = document.querySelector("div#lan") ?? document.createElement("div");

    const element = document.createElement("div");
    element.classList.add("server__");

    const NAME_DESC = document.createElement("div");
    NAME_DESC.classList.add("name_desc");

    const title = document.createElement("span");
    title.classList.add("title");
    title.textContent = server.name;

    const description = document.createElement("span");
    description.classList.add("description");
    description.textContent = server.description;

    NAME_DESC.appendChild(title);
    NAME_DESC.appendChild(description);

    const INFO = document.createElement("div");
    INFO.classList.add("info");

    const whitelist = document.createElement("span");
    whitelist.classList.add("whitelist");
    if (server.whitelisted) whitelist.textContent = "Restricted access";

    const users = document.createElement("span");
    users.classList.add("users");
    users.textContent = server.users;

    INFO.appendChild(whitelist);
    INFO.appendChild(users);

    const hostname = document.createElement("button");
    hostname.textContent = server.hostname + ' (Click here to copy)';
    hostname.addEventListener("click", () => {
      const input = document.querySelector("input#srvco");
      // @ts-ignore
      input.value = server.hostname;
    });

    element.append(NAME_DESC);
    element.append(INFO);
    element.append(hostname);

    lan_div.append(element);
  });
})

function logConsole(doc: string) {
  // console.log(window.pageYOffset, document.documentElement.scrollTop);

  // const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  // const scrollHeight = document.documentElement.scrollHeight;
  // const clientHeight = document.documentElement.clientHeight;

  // const isScrolledDown = scrollTop + clientHeight >= scrollHeight;

  const lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `<span>${lines[i]}</span>`;
  }
  doc = lines.join("");
  const cons = document.querySelector("div#console") ?? document.createElement("div#console");
  cons.innerHTML = `${cons.innerHTML}${doc}`;

  // Scroll down to bottom of the page
  // ! Because Electron is an absolute bitch,
  // ! Any functionality that vaguely works with scrolling
  // ! Will NOT work.
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth',
  })
}

async function displayRegisteredServers() {
  const res = await ipcRenderer.invoke('client/see-saved');

  const registeredServersList = document.querySelector("div#reg_servers") ?? document.createElement("div");
  registeredServersList.innerHTML = '';

  for (let i = 0; i < res.length; i++) {
    const server = res[i];

    const element = document.createElement("div");
    element.classList.add("reg-server");

    const title = document.createElement("span");
    title.classList.add("reg-title");
    title.textContent = server.hostname;

    const detail = document.createElement("span");
    detail.classList.add("reg-det");
    detail.textContent = server.detail;

    const remove = document.createElement("button");
    remove.textContent = "Delete entry";
    remove.classList.add("reg-remove");
    remove.addEventListener("click", async () => {
      await ipcRenderer.invoke('client/remove-saved', i);

      displayRegisteredServers();
    });

    element.appendChild(title);
    element.appendChild(detail);
    element.appendChild(remove);
    registeredServersList.appendChild(element);
    // logConsole(`  <span class=blue>${server.hostname}</span>: ${server.detail}`);
  }
}