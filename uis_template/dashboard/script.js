const socket = io();

socket.on("console", (msg) => {
  msg = msg.replaceAll("\n", "<br/>");
  const cons = document.querySelector("div#console");
  console.log(msg, cons);
  cons.innerHTML = `${cons.innerHTML}<br/>${msg}`;
});

socket.on("userupdate", (msg) => {
  const users = JSON.parse(msg);
  const div = document.querySelector("div#users");
  div.innerHTML = "";
  div.innerHTML = `${users.length} users connected<br/>`;
  for (const user of users) {
    div.innerHTML += `${user.username}<br/>`;
  }
});
