/**
 * SHADE Network Starter
 * Detects local IP, shows network URLs, and starts both servers.
 * Usage: node scripts/start-network.js
 */
const os = require("os");
const { spawn } = require("child_process");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const ip = getLocalIp();

console.log("");
console.log("  ====================================");
console.log("     SHADE Game - Network Startup");
console.log("  ====================================");
console.log("");

if (ip) {
  console.log(`     Local:    http://localhost:3000`);
  console.log(`     Network:  http://${ip}:3000`);
  console.log(`     Socket:   http://${ip}:3001`);
  console.log("");
  console.log(`     Telefondan oynamaq ucun Network linkini ac`);
  console.log(`     Butun cihazlar eyni WiFi-da olmalidir`);
} else {
  console.log("     Network IP tapilmadi - yalniz localhost");
}

console.log("");
console.log("  ====================================");
console.log("");

// Set socket URL for this session
const socketUrl = ip ? `http://${ip}:3001` : "http://localhost:3001";
const env = { ...process.env, NEXT_PUBLIC_SOCKET_URL: socketUrl };

// Use concurrently via the full command string
const cmd = `npx concurrently -n socket,next -c blue,green "node server/index.js" "next dev --hostname 0.0.0.0"`;

const child = spawn(cmd, {
  stdio: "inherit",
  shell: true,
  env,
  cwd: process.cwd(),
});

child.on("exit", (code) => process.exit(code || 0));
