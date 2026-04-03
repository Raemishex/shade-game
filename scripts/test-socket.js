/**
 * SHADE Socket.io End-to-End Test
 * Run: node scripts/test-socket.js
 * Requires: Socket server running on port 3001 (npm run dev:all or node server/index.js)
 */

const { io } = require("socket.io-client");

const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:3001";
const TIMEOUT = 8000;

const results = [];
let passed = 0;
let failed = 0;

function log(label, status, note = "") {
  results.push({ label, status, note });
  const icon = status === "PASS" ? "✓" : "✗";
  console.log(`  ${icon} ${label}${note ? ` — ${note}` : ""}`);
  if (status === "PASS") passed++;
  else failed++;
}

function makeClient(name, color = "#C8A44E") {
  return io(SOCKET_URL, {
    auth: { displayName: name, avatarColor: color },
    autoConnect: false,
    reconnection: false,
    timeout: TIMEOUT,
  });
}

function waitFor(socket, event, timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeout);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

async function run() {
  console.log(`\n🦊 SHADE Socket.io Test — ${SOCKET_URL}\n`);

  // ── Step 1: Connect host ──
  const host = makeClient("HealthHost");
  let roomCode = null;

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Connection timeout")), TIMEOUT);
    host.on("connect", () => {
      clearTimeout(timer);
      log("Socket connection (host)", "PASS", `id: ${host.id}`);
      resolve();
    });
    host.on("connect_error", (err) => {
      clearTimeout(timer);
      log("Socket connection (host)", "FAIL", err.message);
      reject(err);
    });
    host.connect();
  }).catch(() => {
    printSummary();
    process.exit(1);
  });

  // ── Step 2: Create room ──
  await new Promise((resolve) => {
    host.emit("room:create", { displayName: "HealthHost", avatarColor: "#C8A44E" });
    const timer = setTimeout(() => {
      log("room:create", "FAIL", "Timeout");
      resolve();
    }, TIMEOUT);
    host.once("room:joined", (data) => {
      clearTimeout(timer);
      roomCode = data?.room?.code || data?.code;
      if (roomCode) {
        log("room:create", "PASS", `code: ${roomCode}`);
      } else {
        log("room:create", "FAIL", "No room code in response");
      }
      resolve();
    });
    host.once("room:error", (err) => {
      clearTimeout(timer);
      log("room:create", "FAIL", err?.message || JSON.stringify(err));
      resolve();
    });
  });

  if (!roomCode) {
    printSummary();
    host.disconnect();
    process.exit(1);
  }

  // ── Step 3: Connect 2 more players and join ──
  const p1 = makeClient("HealthPlayer1");
  const p2 = makeClient("HealthPlayer2");

  for (const [client, name] of [[p1, "Player1"], [p2, "Player2"]]) {
    await new Promise((resolve) => {
      const timer = setTimeout(() => {
        log(`room:join (${name})`, "FAIL", "Connection timeout");
        resolve();
      }, TIMEOUT);
      client.on("connect", () => {
        client.emit("room:join", { roomCode, displayName: `Health${name}`, avatarColor: "#B8D4A8" });
        client.once("room:joined", () => {
          clearTimeout(timer);
          log(`room:join (${name})`, "PASS");
          resolve();
        });
        client.once("room:error", (err) => {
          clearTimeout(timer);
          log(`room:join (${name})`, "FAIL", err?.message || "error");
          resolve();
        });
      });
      client.on("connect_error", (err) => {
        clearTimeout(timer);
        log(`room:join (${name})`, "FAIL", err.message);
        resolve();
      });
      client.connect();
    });
  }

  // ── Step 4: Start game ──
  await new Promise((resolve) => {
    host.emit("game:start", { roomCode });
    const timer = setTimeout(() => {
      log("game:start", "FAIL", "Timeout — need ≥3 players or host check failed");
      resolve();
    }, TIMEOUT);

    // Listen on all clients for game:word
    let wordCount = 0;
    const checkDone = () => {
      if (wordCount >= 3) {
        clearTimeout(timer);
        log("game:start", "PASS", "game started");
        log("game:word received (all 3 players)", "PASS");
        resolve();
      }
    };

    for (const client of [host, p1, p2]) {
      client.once("game:word", () => {
        wordCount++;
        checkDone();
      });
    }

    host.once("game:error", (err) => {
      clearTimeout(timer);
      log("game:start", "FAIL", err?.message || "error");
      resolve();
    });
  });

  // ── Step 5: Submit clue from host ──
  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      log("clue:submit", "FAIL", "Timeout");
      resolve();
    }, TIMEOUT);
    host.emit("clue:submit", { roomCode, clue: "test_clue" });
    host.once("clue:received", () => {
      clearTimeout(timer);
      log("clue:submit + clue:received", "PASS");
      resolve();
    });
    // also accept if it broadcasts to room
    p1.once("clue:received", () => {
      clearTimeout(timer);
      log("clue:submit + clue:received", "PASS", "broadcast ok");
      resolve();
    });
  });

  // ── Cleanup ──
  host.disconnect();
  p1.disconnect();
  p2.disconnect();

  printSummary();
}

function printSummary() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(" TEST                                  STATUS  NOTES");
  console.log("─────────────────────────────────────────────────");
  for (const r of results) {
    const pad = r.label.padEnd(38);
    const status = r.status === "PASS" ? "✓ PASS" : "✗ FAIL";
    console.log(` ${pad} ${status}  ${r.note}`);
  }
  console.log(`\n Total: ${passed}/${passed + failed} passed`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

run().catch((err) => {
  console.error("Fatal:", err.message);
  printSummary();
  process.exit(1);
});
