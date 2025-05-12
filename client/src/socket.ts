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
      const obj: { Time: number, Author: string, Text: string, Attachments: string[] } = { Time: data[i].Time, Author: data[i].Author, Text: "", Attachments: [] };
      obj.Text = aesDecrypt(data[i].Text, STATUS.aes.shar, STATUS.aes.iv);
      if ("Attachments" in data[i]) {
        for (const attachment of data[i].Attachments) {
          obj.Attachments.push(aesDecrypt(attachment, STATUS.aes.shar, STATUS.aes.iv));
        }
      }
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

  if (contents.length > STATUS.limits.txt) clientError(`Message is too long! (${contents.length}/${STATUS.limits.txt})`);

  socket.emit('msg/plain',
    JSON.stringify({
      "Authorization": STATUS.id,
      "Text": aesEncrypt(contents, STATUS.aes.shar, STATUS.aes.iv),
    })
  );
};

export function sendMedias(contents: { data: string, ext: string }[]) {
  if (!socket) return;
  if (!STATUS.limits.mb) return;

  // Limits check (also happens on the server side)
  const MEDIAS = [];
  for (const media of contents) {
    if (media.data.length >= STATUS.limits.mb * 1000 * 1000) {
      clientError(`Media size limit hit! (${media.data.length / 1024}kB/${STATUS.limits.mb * 1000}kB)`);
      continue;
    }

    console.log(`Registered 1 attachment of type ${media.ext}`);
    MEDIAS.push({ data: aesEncrypt(media.data, STATUS.aes.shar, STATUS.aes.iv), ext: media.ext });
  }

  console.log(`Sending ${MEDIAS.length} attachments`);

  socket.emit('msg/plain', JSON.stringify({
    "Authorization": STATUS.id,
    "Text": aesEncrypt("", STATUS.aes.shar, STATUS.aes.iv), // Not exactly sure if AES still creates empty strings when passed empty strings
    "Attachments": MEDIAS,
  }));
}

export default {
  connect,
  disconnect,
  send,
  sendMedias,

  STATUS,
};