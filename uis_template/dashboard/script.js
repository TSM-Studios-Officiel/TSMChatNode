const socket = io();

socket.on("console", (msg) => {
  const cons = document.querySelector("div#console");
  console.log(msg, cons);
  cons.innerHTML = `${cons.innerHTML}<br/>${msg}`;
});