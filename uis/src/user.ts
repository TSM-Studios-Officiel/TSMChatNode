import axios from "axios";
import { CENTRAL_SERVER_URL } from ".";
import { keypair, rsaDecrypt } from "./encryption";

export interface User {
  username: string,
  id: string,
}

export async function getUsernameFromID(id: string): Promise<string> {
  try {
    // ! IDs are by default RSA-encrypted by clients when sent in accordance to the central server's RSA key
    const data = {
      id, key: keypair.pub,
    }

    const res = await axios({
      method: 'post',
      url: CENTRAL_SERVER_URL + '/user-info',
      data,
    });

    const username = rsaDecrypt(res.data);
    return username;
  } catch (_) {
    return "\0";
  }
}
