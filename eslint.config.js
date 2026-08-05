import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.cjs",
      "scripts/**",
      // Script de inyección i18n de un solo uso, mismo caso que scripts/**
      "_tmp_i18n_inject.mjs",
      "public/**",
      "worker-configuration.d.ts",
      "**/*-DESKTOP-62AB2BV.*",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "no-control-regex": "off",
    },
  },
  {
    files: [
      "src/web/contexts/**/*.tsx",
      "src/web/components/ui/button.tsx",
      "src/web/pages/settings-page.tsx",
      // Exportan helpers/constantes junto al componente: sólo afecta a Fast Refresh en dev.
      "src/web/components/error-boundary.tsx",
      "src/web/components/sessions/podiatry-examination-fields.tsx",
      "src/web/components/settings/paint-color-picker.tsx",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["src/web/lib/api-client.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/api/**/*.ts"],
    rules: {
      // Debe ir después del bloque **/*.{ts,tsx} para no ser sobrescrito
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
