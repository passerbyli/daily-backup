import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "eslint-config-prettier";

const ignores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  ".**",
  "scripts/**",
  "**/*.d.tsx",
];

export default defineConfig([
  // 通用配置
  {
    ignores,
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
    ],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parser: tseslint.parser,
    },
    rules: {
      "no-var": "error", // 禁止使用 var
    },
  },

  // 前端配置
  {
    ignores,
    files: [
      "app/frontend/**/*.{js,ts,jsx,tsx,vue}",
      "packages/components/**/*.{js,ts,jsx,tsx,vue}",
    ],
    exports: [
      ...eslintPluginVue.configs["flat/recommended"],
      eslintConfigPrettier,
    ],
    languageOptions: {
      global: {
        ...globalThis.browser,
      },
    },
  },
  // 后端配置
  {
    ignores,
    files: ["app/backend/**/*.{js,ts}"],
    languageOptions: {
      global: {
        ...globalThis.node,
      },
    },
  },
]);
