/**
 * SHADE API Health Check Script
 * Run: node scripts/healthcheck.js
 * Requires: Next.js dev server running on http://localhost:3000
 */

const BASE = process.env.BASE_URL || "http://localhost:3000";

const results = [];
let authToken = "";
let testUserId = "";
const testEmail = `healthcheck_${Date.now()}@shade-test.com`;
const testPassword = "HealthCheck123!";

async function check(label, fn) {
  try {
    const result = await fn();
    results.push({ label, status: "PASS", note: result || "" });
    console.log(`  ✓ ${label}${result ? ` — ${result}` : ""}`);
  } catch (err) {
    results.push({ label, status: "FAIL", note: err.message });
    console.log(`  ✗ ${label} — ${err.message}`);
  }
}

async function run() {
  console.log(`\n🦊 SHADE Health Check — ${BASE}\n`);

  // GET /api/categories
  await check("GET /api/categories", async () => {
    const res = await fetch(`${BASE}/api/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = data.categories?.length ?? 0;
    if (count < 1) throw new Error(`Expected categories, got ${count}`);
    return `${count} categories`;
  });

  // POST /api/auth/register
  await check("POST /api/auth/register", async () => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: `hc_${Date.now()}`,
        email: testEmail,
        password: testPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok && !data.token) throw new Error(data.error || `HTTP ${res.status}`);
    authToken = data.token || "";
    testUserId = data.user?.id || data.user?._id || "";
    return testUserId ? `userId: ${testUserId.slice(0, 8)}...` : "registered";
  });

  // POST /api/auth/login
  await check("POST /api/auth/login", async () => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (!data.token) throw new Error("No token returned");
    authToken = data.token;
    testUserId = data.user?.id || data.user?._id || testUserId;
    return "token received";
  });

  // GET /api/auth/me
  await check("GET /api/auth/me", async () => {
    if (!authToken) throw new Error("No auth token (login failed)");
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Cookie: `shade_token=${authToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data.user?.username || "user found";
  });

  // POST /api/rooms
  await check("POST /api/rooms", async () => {
    const guestId = `guest_healthcheck_${Date.now()}`;
    const res = await fetch(`${BASE}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hostId: guestId,
        displayName: "HealthBot",
        avatarColor: "#C8A44E",
      }),
    });
    const data = await res.json();
    if (!res.ok && !data.success && !data.dbError) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.dbError) return "WARN: DB unavailable, local fallback ok";
    return `room code: ${data.room?.code || "?"}`;
  });

  // GET /api/leaderboard
  await check("GET /api/leaderboard", async () => {
    const res = await fetch(`${BASE}/api/leaderboard`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    const count = data.users?.length ?? data.leaderboard?.length ?? 0;
    return `${count} entries`;
  });

  // GET /api/users/[id]/history
  await check("GET /api/users/[id]/history", async () => {
    const id = testUserId || "guest_test";
    const res = await fetch(`${BASE}/api/users/${id}/history?limit=5`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return `${data.history?.length ?? 0} entries`;
  });

  // Print summary table
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  console.log(" ENDPOINT                          STATUS  NOTES");
  console.log("─────────────────────────────────────────────────");
  for (const r of results) {
    const pad = r.label.padEnd(34);
    const status = r.status === "PASS" ? "✓ PASS" : "✗ FAIL";
    console.log(` ${pad} ${status}  ${r.note}`);
  }
  const passed = results.filter((r) => r.status === "PASS").length;
  console.log(`\n Total: ${passed}/${results.length} passed`);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

run().catch(console.error);
