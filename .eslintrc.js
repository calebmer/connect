module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
  },
  plugins: [
    "@typescript-eslint",
    "import",
    "react",
    "react-hooks",
    "react-native",
  ],
  settings: {react: {version: "16.8"}},
  extends: ["eslint:recommended", "plugin:react/recommended"],
  env: {
    es6: true,
    node: true,
    browser: true,
  },
  rules: {
    "no-console": "warn",
    "no-async-promise-executor": "warn",
    "no-misleading-character-class": "warn",
    "no-template-curly-in-string": "warn",
    "require-atomic-updates": "warn",
    "block-scoped-var": "error",
    "consistent-return": "warn",
    eqeqeq: ["warn", "always", {null: "ignore"}],
    "no-alert": "warn",
    "no-caller": "warn",
    "no-eval": "warn",
    "no-extend-native": "warn",
    "no-extra-label": "warn",
    "no-implied-eval": "warn",
    "no-multi-str": "warn",
    "no-new-func": "warn",
    "no-octal-escape": "warn",
    "no-self-compare": "warn",
    "no-unused-expressions": "warn",
    "no-with": "error",
    radix: "warn",
    "wrap-iife": "warn",
    yoda: "warn",
    "no-label-var": "error",
    "no-shadow-restricted-names": "error",
    "no-buffer-constructor": "warn",
    "no-path-concat": "warn",
    camelcase: ["warn", {properties: "never"}],
    "prefer-arrow-callback": "warn",
    "no-inner-declarations": "off",
    "func-style": ["warn", "declaration"],
    "no-var": "warn",
    "prefer-const": "warn",

    // NOTE: TypeScript will warn about this.
    "no-unused-vars": "off",

    "@typescript-eslint/adjacent-overload-signatures": "warn",
    "@typescript-eslint/array-type": ["warn", "generic"],
    "@typescript-eslint/no-angle-bracket-type-assertion": "warn",
    "@typescript-eslint/no-triple-slash-reference": "warn",
    "@typescript-eslint/prefer-function-type": "warn",

    "import/first": "warn",
    "import/order": ["warn", {"newlines-between": "never"}],
    "import/newline-after-import": "warn",

    "react/jsx-key": "warn",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    "react-native/no-unused-styles": "warn",
  },
};
