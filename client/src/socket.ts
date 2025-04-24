import { io, Socket } from "socket.io-client";
import { affirmConnection, receiveMessages, SESSION_ID } from ".";

let socket: Socket | undefined;

export const STATUS = {
  host: "",
  id: "",
  aes: {
    shar: Buffer.from(""),
    iv: Buffer.from(""),
  }
};

export function connect(hostname: string) {
  socket = io(`http://${hostname}:48025/`, { query: { id: SESSION_ID } });
  STATUS.host = hostname;

  socket.on("id", (data: string) => {
    STATUS.aes = JSON.parse(data);
    affirmConnection(STATUS.host);
  });

  socket.on("msg", (data: string) => {
    receiveMessages(data);
  });
}

export function disconnect() {
  if (!socket) return;
  socket.disconnect();
  STATUS.host = "";
  STATUS.id = "";
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