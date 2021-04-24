module.exports = {
  "env": {
    "browser": true,
    "jest": true,
    "node": true,
  },
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    // add these parser options
    // "tsconfigRootDir": __dirname,
    // "project": ["./tsconfig.json"],
    "extraFileExtensions": [".svelte"],
  },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "google",
  ],
  "plugins": ["html", "svelte3", "@typescript-eslint", "@typescript-eslint/eslint-plugin", "eslint-plugin-tsdoc"],
  "overrides": [
    {
      "files": ["*.svelte"],
      "processor": "svelte3/svelte3",
    },
  ],
  "settings": {
    "svelte3/typescript": require("typescript"),
    "svelte3/ignore-styles": () => true,
  },
  "rules": {
    "new-cap": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "object-curly-spacing": ["error", "always"],
    "linebreak-style": ["error", "unix"],
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "jsx-quotes": "warn",
    "quote-props": ["error", "consistent"],
    "require-jsdoc": "off",
    "max-len": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "tsdoc/syntax": "warn",
    "valid-jsdoc": "off",
  },
};
