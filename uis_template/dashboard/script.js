const socket = io();

socket.on("console", (msg) => {
  console.log(msg);
});
