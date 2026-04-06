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
      // Proyecto histórico: ir sustituyendo `any` con el tiempo
      "@typescript-eslint/no-explicit-any": "warn",
      // Regex de control ASCII intencional (sanitización / cabeceras)
      "no-control-regex": "off",
    },
  },
);
