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
        logConsole(
          `<span class=red>Command is missing one positional argument`,
        );
        break;
      }

      hostname = argv[0];

      await clientapi.connect(hostname);
      break;
    }

    case "disconnect": {
      await clientapi.disconnect();
      const hostname = await clientapi.getHostname();
      logConsole(
        `<span class=green>Disconnected from ${hostname}</span>`,
      );
      break;
    }

    // TODO: Make a LOGIN and SIGNUP command that POST information to the central server and retrieves and saves a SESSION ID.

    case "?":
    case "help": {
      logConsole(`Available commands:`);
      logConsole(
        `!connect <hostname>: Connects to a specified UIS on <hostname>`,
      );
      break;
    }

    default: {
      logConsole(`<span class=red>Unknown command: ${cmd}</span>`);
      break;
    }
  }
}

function logConsole(doc) {
  clientapi.log(doc);
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

function connectToServer() {
  // TODO: Ré-écrire le code qui permet la connection à un serveur.
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

function seeRegisteredServer() {
  // TODO: Faire une page registered.html
  const registrationWindow = window.open("registered.html", "_blank");
  registrationWindow.focus();
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
