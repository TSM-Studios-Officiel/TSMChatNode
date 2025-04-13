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

      const res = await clientapi.connect(hostname);
      if (res == true) {
        logConsole(`<span class=green>Connected to ${hostname}</span>`);
      } else {
        logConsole(`<span class=red>Could not connect to ${hostname}</span>`);
      }
      break;
    }

    case "disconnect": {
      const res = await clientapi.disconnect();
      const hostname = await clientapi.getHostname();
      if (res == true) {
        logConsole(
          `<span class=green>Disconnected from ${hostname}</span>`,
        );
      } else {
        logConsole(`<span class=red>Could not disconnect</span>`);
      }
      break;
    }

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
