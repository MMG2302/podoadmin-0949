# Comandos para correr el sistema (copiar y pegar)

Ruta del proyecto:
```
c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949
```

---

## Terminal 1 – Configuración y servidor de desarrollo

Abre una terminal, ve a la carpeta del proyecto y ejecuta en este orden (uno por uno o el bloque completo):

```powershell
cd c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949
bun run cf-typegen
bun run db:generate
bun run db:migrate:remote
bun run db:seed:remote
bun dev
```

Deja esta terminal abierta con `bun dev` corriendo.

---

## Terminal 2 – Túnel (para ver desde celular/exterior)

Abre **otra** terminal, ve a la misma carpeta y ejecuta:

```powershell
cd c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949
bun run tunnel
```

Copia la URL que aparezca (tipo `https://xxxx.trycloudflare.com`) y ábrela en el navegador o en el celular.

---

## Resumen rápido (solo comandos)

**Terminal 1:**
```
cd c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949
bun run cf-typegen
bun run db:generate
bun run db:migrate:remote
bun run db:seed:remote
bun dev
```

**Terminal 2:**
```
cd c:\Users\mvs92\OneDrive\Escritorio\clinic\podoadmin-0949
bun run tunnel
```
