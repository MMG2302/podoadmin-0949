# Comandos PowerShell – Base de datos y desarrollo

Comandos para ejecutar desde PowerShell en la raíz del proyecto.

---

## Ir al proyecto

```powershell
cd "c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949"
```

---

## Migraciones

**Local** (para `bun dev` – crea/actualiza tablas en la base local):

```powershell
echo y | bunx wrangler d1 migrations apply DB --local
```

**Remoto** (Cloudflare – crea/actualiza tablas en la base en la nube):

```powershell
bun run db:migrate:remote
```

---

## Seed (datos de prueba)

**Local:**

```powershell
bun run db:seed:local
```

**Remoto:**

```powershell
bun run db:seed:remote
```

---

## Super admin

**Generar** el archivo `scripts/super-admin.sql` (cambia email, contraseña y nombre):

```powershell
bun run db:create-super-admin "tu@email.com" "TuPasswordSegura" "Tu Nombre"
```

**Aplicar en local** (para poder entrar con ese usuario en desarrollo):

```powershell
bunx wrangler d1 execute DB --local --file=scripts/super-admin.sql
```

**Aplicar en remoto** (producción/staging):

```powershell
bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
```

---

## Desarrollo

```powershell
bun dev
```

---

## Otros

**Generar tipos de Cloudflare** (tras cambiar `wrangler` o la config):

```powershell
bun run cf-typegen
```

---

## Flujo típico la primera vez (solo local para dev)

```powershell
cd "c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949"
echo y | bunx wrangler d1 migrations apply DB --local
bun run db:create-super-admin "mvs.92.m@gmail.com" "MarioMauriesG9223*" "Mario Mauries García"
bunx wrangler d1 execute DB --local --file=scripts/super-admin.sql
bun dev
```

---

## Flujo para remoto (producción)

```powershell
cd "c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949"
bun run db:migrate:remote
bun run db:create-super-admin "mvs.92.m@gmail.com" "MarioMauriesG9223*" "Mario Mauries García"
bunx wrangler d1 execute DB --remote --file=scripts/super-admin.sql
```
