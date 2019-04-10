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
  extends: ["eslint:recommended", "plugin:react/recommended"],
  env: {
    es6: true,
    node: true,
    browser: true,
    jest: true,
  },
  rules: {
    "no-empty": "warn",
    "no-empty-pattern": "off",
    "no-unused-vars": "warn",
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
    "prefer-arrow-callback": "warn",
    "no-inner-declarations": "off",
    "func-style": ["warn", "declaration"],
    "no-var": "warn",
    "prefer-const": ["warn", {destructuring: "all"}],
    "sort-imports": "warn",

    "@typescript-eslint/adjacent-overload-signatures": "warn",
    "@typescript-eslint/array-type": ["warn", "generic"],
    "@typescript-eslint/no-angle-bracket-type-assertion": "warn",
    "@typescript-eslint/no-triple-slash-reference": "warn",
    "@typescript-eslint/prefer-function-type": "warn",

    // NOTE: Use the TypeScript camelcase rule instead of the base ESLint one.
    camelcase: "off",
    "@typescript-eslint/camelcase": [
      "warn",
      {
        properties: "never",
        allow: ["^UNSAFE_", "^unstable_", "^test_", "^ignorePrivacy_"],
      },
    ],

    "import/first": "warn",
    "import/newline-after-import": "warn",
    "import/no-extraneous-dependencies": "error",

    "react/jsx-key": "warn",
    "react/prop-types": "off",
    "react/display-name": "off",

    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",

    "react-native/no-unused-styles": "warn",
  },
  overrides: [
    {
      files: ["*.ts", "*.tsx"],
      rules: {
        // NOTE: TypeScript will warn about this. TypeScript also does it better
        // since it can understand reads/writes.
        "no-undef": "off",
        "no-unused-vars": "off",
        "consistent-return": "off",
      },
    },
  ],
};
