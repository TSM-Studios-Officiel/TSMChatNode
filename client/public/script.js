document.querySelector("input").onkeydown = (e) => {
  if (e.key != "Enter") return;

  const input = document.querySelector("input");
  const val = input.value;
  input.value = "";
  parseCommand(val);
};

async function parseCommand(str) {
  if (str[0] != "!") {
    clientapi.sendMessage(str);
    return;
  }

  const cmd = str.split(" ")[0].split("").splice(1).join("");
  const s_p = cmd.length + 2;
  const argv = [];
  let arg = "";
  let in_string = false;

  // Arguments parser
  for (let p = s_p; p < str.length; p++) {
    if (str[p] == '"' && str[p - 1] != "\\") {
      in_string = !in_string;
      continue;
    } else if (!in_string && str[p] == " " && arg != "") {
      argv.push(arg.trim());
      arg = "";
      continue;
    }

    arg += str[p];
  }

  if (arg != "") argv.push(arg);

  switch (cmd) {
    case "connect": {
      let hostname = "";
      if (argv.length < 1) {
        clientapi.log(
          `<span class=red>Command is missing one positional argument</span>`,
        );
        break;
      }

      hostname = argv[0];
      serverConnect(hostname);
      break;
    }

    case "disconnect": {
      disconnectFromServer();
      break;
    }

    case "scan": {
      await clientapi.scanLAN();
      break;
    }

    case "listing": {
      await clientapi.showListing();
      break;
    }

    case "save": {
      if (argv.length < 1) {
        clientapi.log(
          `<span class=red>Command is missing one positional argument</span>`,
        );
        break;
      }

      // Use user provided hostname or the server we're connected to
      let hostname = "";
      if (argv[0] != "0") hostname = argv[0];
      else hostname = await clientapi.getHostname();

      // If no hostname provided at ALL
      if (hostname == "") {
        clientapi.log(
          `<span class=red>You did not provide an IP and you are not currently connected to any server</span>`,
        );
        break;
      }

      // Use details or not depending on whether the user supplied some
      let detail = "";
      if (argv.length >= 2) detail = argv.splice(1).join(" ");
      await clientapi.registerServer(hostname, detail);
      break;
    }

    case "attach": {
      if (argv.length < 1) {
        clientapi.log(
          `<span class=red>Command is missing one positional argument</span>`,
        );
        break;
      }

      clientapi.sendMedias(argv);
      break;
    }

    case "?":
    case "help": {
      clientapi.log(`Available commands:`);
      clientapi.log(
        `!connect &lt;hostname&gt;: Connects to a specified UIS on &lt;hostname&gt;`,
      );
      clientapi.log(
        `  <span class=blue>Example: !connect localhost ; !connect 0.0.0.1 ; !connect some.domain.net</span><br/>`,
      );
      clientapi.log(
        `!scan: Scans your local area network for available UIS servers.`,
      );
      clientapi.log(
        `!listing: Retrieves all available listed UIS servers from main.`,
      );
      clientapi.log(
        `!save [hostname|0] [...detail]: Save the server at [hostname] with [...detail]. Uses the current server if no hostname was provided.`,
      );
      clientapi.log(
        `  <span class=blue>Example: !save 0 A Chat Node; !save some.domain.net Domain chat node`,
      );
      clientapi.log(`!disconnect: Disconnects from the current server.`);

      break;
    }

    case "spamdbg": {
      for (let i = 0; i < 50; i++) {
        clientapi.log(`<span class=red>${i}</span>`);
      }
      break;
    }

    default: {
      clientapi.log(`<span class=red>Unknown command: ${cmd}</span>`);
      break;
    }
  }
}

function closemenu() {
  document.querySelector("div.menu").classList.remove("menuopened");
  document.querySelector("div.full").classList.remove("full_closed");
  document.querySelector("div.menu").classList.add("menuclosed");
  document.querySelector("div.full").classList.add("full_opened");
}

function openmenu() {
  document.querySelector("div.menu").classList.add("menuopened");
  document.querySelector("div.full").classList.add("full_closed");
  document.querySelector("div.menu").classList.remove("menuclosed");
  document.querySelector("div.full").classList.remove("full_opened");
}

// ! This function is called by a menu button
function connectToServer() {
  const server = document.querySelector("input#srvco").value;

  const connected = document.querySelector("span#connected_server").textContent;

  if (connected != "none") {
    disconnectFromServer();
    return;
  }

  serverConnect(server);
}

async function disconnectFromServer() {
  const connect_button = document.querySelector("button#connectbutton") ??
    document.createElement("button");
  connect_button.textContent = "Connect";

  const hostname = await clientapi.getHostname();
  await clientapi.disconnect();
  clientapi.log(
    `<span class=green>Disconnected from ${hostname}</span>`,
  );
}

async function serverConnect(hostname) {
  const connect_button = document.querySelector("button#connectbutton") ??
    document.createElement("button");
  connect_button.textContent = "Disconnect";
  await clientapi.connect(hostname);
}

function createServer() {
  window.open(
    "https://github.com/TSM-Studios-Officiel/TSMChatNode/releases",
    "_blank",
  );
}

function openProfile() {
  // TODO: Faire une page profile.html
  const profileWindow = window.open("profile.html", "_blank");
  profileWindow.focus();
}

async function signin() {
  const username = document.querySelector("#signin__username").value;
  const password = document.querySelector("#signin__password").value;

  clientapi.log(`Connecting as ${username}`);
  document.querySelector("span#username").textContent = username;

  await clientapi.signin(username, password);
}

async function signup() {
  const username = document.querySelector("#signup__username").value;
  const password = document.querySelector("#signup__password").value;
  const confirmed_password = document.querySelector("#signup__passconf").value;

  if (password !== confirmed_password) {
    clientapi.log(`<span class=red>Passwords do not match</span>`);
    return;
  }

  clientapi.log(`Connecting as ${username}`);
  document.querySelector("span#username").textContent = username;

  await clientapi.signup(username, password);
}

function openDialog(index) {
  const dialogBoxes = document.querySelectorAll("dialog");
  for (const dialogBox of dialogBoxes) {
    if (dialogBox.getAttribute("open")) {
      dialogBox.setAttribute("isopened", true);
    } else {
      dialogBox.setAttribute("isopened", false);
    }
    dialogBox.removeAttribute("open");
  }

  switch (index) {
    case 0: { // signin dialog
      const signin = document.querySelector(".signin_dialog");
      const isopenedtext = signin.getAttribute("isopened");
      let isOpened;
      if (isopenedtext == "true") isOpened = true;
      else isOpened = false;
      signin.removeAttribute("isopened");
      signin.setAttribute("isopened", !isOpened);
      if (!isOpened) {
        signin.setAttribute("open", true);
      } else {
        signin.removeAttribute("open");
      }
      break;
    }
    case 1: { // signup dialog
      const signup = document.querySelector(".signup_dialog");
      const isopenedtext = signup.getAttribute("isopened");
      let isOpened;
      if (isopenedtext == "true") isOpened = true;
      else isOpened = false;
      signup.removeAttribute("isopened");
      signup.setAttribute("isopened", !isOpened);
      if (!isOpened) {
        signup.setAttribute("open", true);
      } else {
        signup.removeAttribute("open");
      }
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  openDialog(0);

  clientapi.seeRegisteredServers();
});
