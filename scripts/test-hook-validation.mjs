/** Simula el cliente api.get y la validación del hook useClinicalListData */
const base = "http://localhost:5173/api";

function parseApiResponse(status, text) {
  let data = {};
  try {
    if (text) data = JSON.parse(text);
  } catch {
    /* non-json */
  }

  if (!status || status < 200 || status >= 300) {
    return {
      success: false,
      error: data.error || "Error en la solicitud",
      message: data.message,
      data,
    };
  }
  return { success: true, data };
}

function hookValidatePatients(response) {
  if (response.success && response.data?.success && Array.isArray(response.data.patients)) {
    return { ok: true, count: response.data.patients.length };
  }
  throw new Error(response.message || response.error || "No se pudieron cargar los pacientes");
}

async function main() {
  const jar = new Map();
  const store = (res) => {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  };
  const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");

  // Login
  let r = await fetch(`${base}/csrf/token`);
  store(r);
  const csrf = (await r.json()).token || jar.get("csrf-token");
  r = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieHeader(), "X-CSRF-Token": csrf || "" },
    body: JSON.stringify({ email: "doctor1@premium.com", password: "doctor123" }),
  });
  store(r);
  console.log("login", r.status);

  for (const ep of ["/patients", "/sessions"]) {
    r = await fetch(`${base}${ep}`, { headers: { Cookie: cookieHeader() } });
    const text = await r.text();
    const wrapped = parseApiResponse(r.status, text);
    console.log("\n", ep, "http", r.status, "content-type", r.headers.get("content-type"));
    console.log(" wrapped.success", wrapped.success, "error", wrapped.error, "message", wrapped.message?.slice?.(0, 50));
    if (ep === "/patients") {
      try {
        const result = hookValidatePatients(wrapped);
        console.log(" hook OK", result);
      } catch (e) {
        console.log(" hook FAIL", e.message);
      }
    }
    if (ep === "/sessions") {
      try {
        if (wrapped.success && wrapped.data?.success && Array.isArray(wrapped.data.sessions)) {
          console.log(" hook OK sessions", wrapped.data.sessions.length);
        } else {
          throw new Error(wrapped.message || wrapped.error || "No se pudieron cargar las sesiones");
        }
      } catch (e) {
        console.log(" hook FAIL", e.message);
      }
    }
  }

  // Strict vs lenient
  r = await fetch(`${base}/patients`, { headers: { Cookie: cookieHeader() } });
  const w = parseApiResponse(r.status, await r.text());
  console.log("\nlenient check:", w.success && Array.isArray(w.data?.patients), "count", w.data?.patients?.length);
}

main().catch(console.error);
