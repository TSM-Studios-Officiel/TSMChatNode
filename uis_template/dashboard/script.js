const socket = io();

const users = [];

socket.on("console", (msg) => {
  logConsole(msg);
});

socket.on("userupdate", (msg) => {
  users = JSON.parse(msg);
});

document.querySelector("input").onkeydown = (e) => {
  if (e.key != "Enter") return;

  const input = document.querySelector("input");
  const val = input.value;
  input.value = "";
  parseCommand(val);
};

function parseCommand(str) {
  if (str[0] != "!") return;

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
    case "stop": {
      let time = 10;
      if (argv.length >= 1) {
        try {
          time = parseInt(argv[0]);
        } catch (e) {
          logConsole(
            `<span class=red>Illegal Argument ${
              argv[0]
            }: must be an integer</span>`,
          );
        }
      }
      socket.emit("stop", time);
      break;
    }

    default: {
      logConsole(`<span class=red>Unknown command: ${cmd}</span>`);
      break;
    }
  }
}

function logConsole(doc) {
  lines = doc.split("\n");
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `<span>${lines[i]}</span>`;
  }
  doc = lines.join("");
  const cons = document.querySelector("div#console");
  cons.innerHTML = `${cons.innerHTML}${doc}`;

  window.scrollTo(0, document.body.scrollHeight);
}

function getTime() {
  const time = new Date(Date.now());
  const format = `[${time.toLocaleString("fr-FR")}]`;
  return format;
}
