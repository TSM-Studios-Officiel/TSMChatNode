const socket = io();

socket.on("console", (msg) => {
  msg = msg.replaceAll("\n", "<br/>");
  const cons = document.querySelector("div#console");
  console.log(msg, cons);
  cons.innerHTML = `${cons.innerHTML}<br/>${msg}`;
});
