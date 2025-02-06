/**
 * Configuration file
 *
 * @type {{ "Allow-Central-Networking": boolean; "Use-LAN": boolean; "Allow-Listing": boolean; Whitelist: boolean; "Whitelist-Users": Array<string>; "Max-Concurrent-Users": number; "Allow-Disk-Save": boolean; "Message-Character-Limit": number; "Allow-Media": boolean; "Media-Size-Limit": number; "Ephemeral-Messages": number; }}
 */
const __CONFIGURATION = {
  // Controls connection to the central server.
  // If disabled, this means that whitelists will not work, and you will not be able to be referenced on the global system,
  // As both of those function using the central database.
  // Default: true
  "Allow-Central-Networking": true,

  // Controls whether this server instance should only be accessible through LAN networks.
  // If enabled, this means the IP used for connecting will be your network IP.
  // This also implies that Allow-Central-Networking will be automatically disabled if you enable this option
  // Default: false
  "Use-LAN": true,

  // Controls listing of this server instance on the global system.
  // If enabled, this means your server will be referenced and viewable online.
  // Default: false
  "Allow-Listing": false,

  // Controls who is allowed to access the server via a whitelist.txt file.
  // If enabled, only users with usernames present in whitelist.txt will be able to join.
  // Default: false
  "Whitelist": false,
  "Whitelist-Users": [""], // Appended upon reading of whitelist.txt

  // Controls the maximum amount of users the server should be able to handle at once.
  // Default: 20
  "Max-Concurrent-Users": 20,

  // Controls whether or not the server instance is allowed to make changes on the host's filesystem to store messages and shared media
  // To conserve them between server reboots.
  // Default: false
  "Allow-Disk-Save": false,

  // Controls how many characters each message is allowed to have at most.
  // Default: 1000
  "Message-Character-Limit": 1000,

  // Controls whether media is allowed to be sent (video, images, files, ...)
  // Default: true
  "Allow-Media": true,

  // Controls the size limit of media in megabytes.
  // Default: 25
  "Media-Size-Limit": 25,

  // Controls the amount of time messages are allowed to persist before being deleted.
  // If set to -1, disables the disappearence of messages after some time entirely.
  // Default: -1
  "Ephemeral-Messages": -1,
};

module.exports = __CONFIGURATION;
