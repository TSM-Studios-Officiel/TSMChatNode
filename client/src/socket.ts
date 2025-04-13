import { io, Socket } from "socket.io-client";
import { receiveMessages } from ".";

let socket: Socket;

export const STATUS = {
  host: "",
  id: "",
};

export function connect(hostname: string): boolean {
  socket = io(`http://${hostname}:48025/`);
  STATUS.host = hostname;

  socket.on("id", (data: string) => {
    STATUS.id = data;
  });

  socket.on("msg", (data: string) => {
    receiveMessages(data);
  });

  return true;
}

export function disconnect(): boolean {
  socket.disconnect();

  return true;
}

export function send(contents: string) {
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