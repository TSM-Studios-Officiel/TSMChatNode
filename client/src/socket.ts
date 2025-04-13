import { io, Socket } from "socket.io-client";
import { affirmConnection, receiveMessages } from ".";

let socket: Socket | undefined;

export const STATUS = {
  host: "",
  id: "",
};

export function connect(hostname: string) {
  socket = io(`http://${hostname}:48025/`);
  STATUS.host = hostname;

  socket.on("id", (data: string) => {
    STATUS.id = data;
    affirmConnection(STATUS.host);
  });

  socket.on("msg", (data: string) => {
    receiveMessages(data);
  });
}

export function disconnect() {
  if (!socket) return;
  socket.disconnect();
  socket = undefined;
}

export function send(contents: string) {
  if (!socket) return;
  socket.emit('msg/plain',
    JSON.stringify({
      "Authorization": STATUS.id,
      "Text": contents,
    })
  );
};

export default {
  connect,
  disconnect,
  send,

  STATUS,
};