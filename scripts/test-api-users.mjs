/** Prueba login + GET pacientes/sesiones para varios usuarios mock */
const base = "http://localhost:5173/api";

async function testUser(email, password) {
  const jar = new Map();
  const store = (res) => {
    const sc = res.headers.getSetCookie?.() ?? [];
    for (const c of sc) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  };
  const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  let r = await fetch(`${base}/csrf/token`, { credentials: "include" });
  store(r);
  const csrfBody = await r.json();
  const csrf = csrfBody.token || jar.get("csrf-token");

  r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(),
      "X-CSRF-Token": csrf || "",
    },
    body: JSON.stringify({ email, password }),
  });
  store(r);
  const loginText = await r.text();
  let login;
  try {
    login = JSON.parse(loginText);
  } catch {
    console.log("\n===", email, "===");
    console.log("LOGIN PARSE FAIL", r.status, loginText.slice(0, 200));
    return;
  }

  console.log("\n===", email, "===");
  console.log("login", r.status, login.user?.role, "systemAccess", login.user?.systemAccess);

  for (const ep of ["/patients", "/sessions", "/auth/verify"]) {
    r = await fetch(`${base}${ep}`, { headers: { Cookie: cookieHeader() } });
    const t = await r.text();
    console.log(ep, r.status, t.slice(0, 180));
  }
}

const users = [
  ["doctor1@premium.com", "doctor123"],
  ["maria.fernandez@premium.com", "manager123"],
  ["pablo.hernandez@gmail.com", "doctor123"],
];

for (const [e, p] of users) {
  await testUser(e, p);
}
