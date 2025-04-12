import axios from 'axios';
import { broadcastConsole } from './dashboard';
import { getTime } from '.';

const GITHUB_API_URL = "https://api.github.com/repos";
const USER_REPO = "TSM-Studios-Officiel/TSMChatNode";

export async function checkForUpdate(debugModeOn: boolean, currentVersion: string) {
  const current = currentVersion.split('.');

  try {
    // data is the releases
    const { data } = await axios.get(`${GITHUB_API_URL}/${USER_REPO}/releases`);

    if (data.length === 0 && debugModeOn) {
      console.log("DEBUG | No releases found.");
      broadcastConsole(`<span class=violet>${getTime()}</span> DEBUG | No releases found`);
      return;
    }

    const latestVersion = data[0].tag_name;
    const latest = latestVersion.split('.');

    if (latest[0] > current[0]) {
      // Major release
      printOutdated(currentVersion, latestVersion);

    } else if (latest[1] > current[1]) {
      // Minor release
      printOutdated(currentVersion, latestVersion);

    } else if (latest[2] > current[2]) {
      // Patch
      printOutdated(currentVersion, latestVersion);
    }
  } catch (e) {
    if (debugModeOn) console.error(`DEBUG | Could not fetch latest releases`);
  }
}

function printOutdated(current: string, latest: string) {
  console.log(`\x1b[1;39;49mYou are running an outdated version: \x1b[0;35;49m${current} \x1b[0;39;49m-> \x1b[0;36;49m${latest}\x1b[0m`);
  console.log(`You can download it \x1b]8;;https://github.com/TSM-Studios-Officiel/TSMChatNode/releases\x07here\x1b]8;;\x07`);

  broadcastConsole(`<span class=violet>${getTime()}</span> You are running an outdated version: <span class=violet>${current}</span> -> <span class=blue>${latest}</span>`);
  broadcastConsole(`<span class=violet>${getTime()}</span> You can download it <a href='https://github.com/TSM-Studios-Officiel/TSMChatNode/releases'>here</a>`);
}