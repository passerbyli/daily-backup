import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginVue from "eslint-plugin-vue";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

const ignores = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  ".**",
  "scripts/**",
  "**/*.d.tsx",
];
// 按需调整你的前后端目录（我按你之前的 apps 结构写了更常见的路径）
const frontendGlobs = [
  "apps/frontend/**/*.{js,ts,jsx,tsx,vue}",
  "packages/components/**/*.{js,ts,jsx,tsx,vue}",
];
const backendGlobs = ["apps/backend/**/*.{js,ts}"];

export default defineConfig([
  // 通用配置
  {
    ignores,
    files: ["**/*.{js,cjs,mjs,ts,tsx,jsx,vue}"],
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
      "@typescript-eslint/no-require-imports": "off",
      "no-var": "error",
      "prettier/prettier": "warn",
    },
    globals: {
      console: "readonly",
    },
  },

  // 前端配置
  {
    ignores,
    files: frontendGlobs,
    exports: [
      ...eslintPluginVue.configs["flat/recommended"],
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        // 若前端代码里用到了 process.env，声明为只读即可避免 no-undef
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    // rules: {
    //   "@typescript-eslint/no-unused-expressions": [
    //     "error",
    //     {
    //       allowShortCircuit: true, // 允许 a && b()
    //       allowTernary: true, // 允许 a ? b() : c()
    //       allowTaggedTemplates: true, // 允许标签模板
    //     },
    //   ],
    //   // 这里可以放你的 Vue 规则
    // },
  },
  // 后端配置
  {
    ignores,
    files: backendGlobs,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);
