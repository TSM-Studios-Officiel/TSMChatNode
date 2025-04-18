import { CENTRAL_SERVER_URL, Config } from ".";
import axios from "axios";

export async function register(config: Config, hostname: string): Promise<boolean> {
  try {
    await axios({
      method: 'post',
      url: CENTRAL_SERVER_URL + '/register',
      data: {
        hostname,
        name: config["Customization"]["Server-Name"],
        description: config["Customization"]["Server-Description"],
        whitelisted: config["Whitelist"],
        allowlist: config["Allow-Listing"],
      },
    });
    return true;
  } catch (_) {
    // If connection times out
    console.log(`Could not connect to the Central Server.`);
  }

  return false;
}

export default {
  register,
}