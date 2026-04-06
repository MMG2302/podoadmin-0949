# Website

React + Vite + Hono + Tailwind + Cloudflare Workers

## Scripts
- `bun run check` — Run before committing to verify types, build, and deployment config
- `bun run cf-typegen` — Run after modifying Cloudflare bindings to regenerate types

## Quick Start

```bash
# Install dependencies
bun install

# Generate types and run migrations
bun cf-typegen
bun db:generate
bun db:migrate

# Start dev server
bun dev
```

## shadcn/ui

Add components you need, customize them however you want.

```bash
bun x shadcn@latest add button card dialog
```

Components land in `src/web/components/ui/`, import with `@/components/ui/button`.

```tsx
import { Button } from "@/components/ui/button"

<Button variant="outline">Click me</Button>
```

## Routing

Client-side routing uses [wouter](https://github.com/molefrog/wouter). Add routes in `src/web/app.tsx`:

```tsx
import { Route, Switch } from "wouter";

<Switch>
  <Route path="/" component={Home} />
  <Route path="/about" component={About} />
</Switch>
```

## Database

Uses [Drizzle ORM](https://orm.drizzle.team/) with Cloudflare D1.

- **Schema:** `src/api/database/schema.ts`
- **Migrations:** `src/api/migrations/` (applied in filename order by Wrangler)

```bash
bun db:generate         # Generate new migrations after changing schema
bun db:migrate          # Apply migrations to local D1
bun db:seed:local       # Insert mock users only in local D1 (optional, for dev)
bun db:migrate:remote   # Apply migrations to remote D1 (production)
```

**When to run migrations:**
- After cloning or pulling the repo: `bun run db:migrate`; luego `bun db:seed:local` si quieres usuarios mock en local
- After changing `schema.ts`: `bun run db:generate` then `bun run db:migrate`
- Before deploy / on production: `bun run db:migrate:remote` (or your CI step)

**Usuarios mock (solo local):** Los usuarios de demostración ya no forman parte de las migraciones. Para tenerlos **solo en local**, tras `bun db:migrate` ejecuta `bun db:seed:local`; así el seed se aplica solo a la D1 local. `db:migrate:remote` no incluye seed, por lo que en remoto/producción no se insertan usuarios mock.

## Coding Style

- Functional programming preferred (use `const`, avoid `let`)
- Extract types into separate interfaces
- No explicit return types unless necessary
- Prefer early returns to reduce nesting
- Use switch statements or key-value maps instead of nested if statements
- Keep code simple—minimize complex state and prop drilling
- Use existing libraries over custom implementations
- Prefer built-in Node modules over custom utils
- Write tests for complex functionality