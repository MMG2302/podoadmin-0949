/** Prueba login + GET pacientes/sesiones contra dev local */
const base = "http://localhost:5173/api";

async function main() {
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
    headers: { "Content-Type": "application/json", Cookie: cookieHeader(), "X-CSRF-Token": csrf || "" },
    body: JSON.stringify({ email: "doctor1@premium.com", password: "doctor123" }),
  });
  store(r);
  console.log("login", r.status, (await r.text()).slice(0, 200));

  r = await fetch(`${base}/patients`, { headers: { Cookie: cookieHeader() } });
  const pText = await r.text();
  console.log("patients", r.status, pText.slice(0, 400));

  r = await fetch(`${base}/sessions`, { headers: { Cookie: cookieHeader() } });
  const sText = await r.text();
  console.log("sessions", r.status, sText.slice(0, 400));
}

main().catch((e) => console.error(e));
