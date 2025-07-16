import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default [
  {
    ignores: [
      "dist/**",
      "src-tauri/**",
      "node_modules/**",
      "*.config.js",
      "**/*.d.ts",
      "**/*build*/**",
      "**/*target*/**",
      "**/out/**",
    ],
  },
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
  },
  { 
    languageOptions: { 
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    } 
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
    },
  },
  {
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-expressions": "off",
      "no-constant-condition": "warn",
      "no-fallthrough": "warn",
      "no-empty": "warn",
      "no-undef": "off",
      "react/no-unescaped-entities": "warn",
    },
  },
];
