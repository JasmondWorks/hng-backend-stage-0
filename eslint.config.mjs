// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Required for Express global namespace augmentation (declare global { namespace Express ... })
      "@typescript-eslint/no-namespace": "off",
      // Optional chaining + non-null assertion is handled carefully in the codebase
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "*.mjs", "prisma.config.ts"],
  },
);
