import { io, Socket } from "socket.io-client";
import { affirmConnection, clientError, receiveMessages, SESSION_ID } from ".";
import { aesDecrypt, aesEncrypt } from "./encryption";

let socket: Socket | undefined;

export let STATUS = {
  host: "",
  id: "",
  aes: {
    shar: "",
    iv: "",
  },
  limits: {
    txt: 0,
    mb: 0,
    media: false,
  }
};

export function connect(hostname: string) {
  socket = io(`http://${hostname}:48025/`, { query: { id: SESSION_ID } });
  STATUS.host = hostname;

  socket.on("id", (data: string) => {
    const __data = JSON.parse(data);
    STATUS.id = __data.id;
    STATUS.aes = { shar: __data.shar, iv: __data.iv };
    STATUS.limits = { txt: __data.txt, mb: __data.mb, media: __data.amed };
    affirmConnection(STATUS.host);
  });

  socket.on("msg", (data: any) => {
    if (typeof data != typeof []) return;
    if (data.length == 0) return;

    const __data = [];
    for (let i = 0; i < data.length; i++) {
      const obj = { Time: data[i].Time, Author: data[i].Author, Text: "" };
      obj.Text = aesDecrypt(data[i].Text, STATUS.aes.shar, STATUS.aes.iv);
      __data.push(obj);
    }
    receiveMessages(JSON.stringify(__data));
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

  console.log(contents.length);
  if (contents.length > STATUS.limits.txt) clientError(`Message is too long! (${contents.length}/${STATUS.limits.txt})`);

  socket.emit('msg/plain',
    JSON.stringify({
      "Authorization": STATUS.id,
      "Text": aesEncrypt(contents, STATUS.aes.shar, STATUS.aes.iv),
    })
  );
};

export default {
  connect,
  disconnect,
  send,

  STATUS,
};