import { networkInterfaces } from 'os';

function readNetInterfaces(): Record<string, string[]> {
  const nets = networkInterfaces();
  const results: Record<string, string[]> = Object.create(null);

  if (!nets) return {};

  for (const name of Object.keys(nets)) {
    const netGroup = nets[name] ?? Object.create(null);
    for (const net of netGroup) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  return results;
}

export function configureLAN(): string {
  const nets = readNetInterfaces();
  if (!nets) {
    console.error(`No network IP address available! Are you connected via Wi-Fi or Ethernet to a network?`);
    return 'localhost';
  };

  const possibleIPs: Set<string> = new Set();

  Object.values(nets).forEach((element) => {
    for (const ip of element) {
      possibleIPs.add(ip);
    }
  });

  console.log(`Detected ${possibleIPs.size} IP addresses over local network.`);
  const allIPs: string[] = [];
  possibleIPs.forEach((element) => {
    allIPs.push(element);
  });
  return allIPs[0];
}