# Comandos para correr el sistema

Raíz del proyecto (ajusta la ruta si clonaste en otro sitio):

```
C:\proyectos\podoadmin-0949
```

---

## Desarrollo local

```powershell
cd C:\proyectos\podoadmin-0949
npm install
npm run dev
```

Abre http://localhost:5173

---

## Migraciones (primera vez o tras pull)

```powershell
cd C:\proyectos\podoadmin-0949
npm run db:migrate
```

---

## Reset local con datos mock

```powershell
cd C:\proyectos\podoadmin-0949
npm run db:reset:local
npm run dev
```

Ver cuentas de prueba en `docs/DEV_MOCK_RESET.md`.

---

## Super admin propio (opcional)

```powershell
cd C:\proyectos\podoadmin-0949
npm run db:create-super-admin "tu@email.com" "TuPasswordSegura" "Tu Nombre"
npx wrangler d1 execute DB --local --file=scripts/super-admin.sql
```

`scripts/super-admin.sql` no se commitea (está en `.gitignore`).
