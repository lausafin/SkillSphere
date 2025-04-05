module.exports = {
    root: true,
    env: { browser: true, es2020: true },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
      'plugin:react-hooks/recommended', // Enforces Rules of Hooks
      'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
      'plugin:react/jsx-runtime', // Supports new JSX Transform
      'plugin:prettier/recommended', // Integrates Prettier with ESLint
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      project: ['./tsconfig.json', './tsconfig.node.json'], // Important for type-aware linting
      tsconfigRootDir: __dirname,
    },
    plugins: [
      'react-refresh', // Enforces rules specific to React Fast Refresh
      '@typescript-eslint', // Required with the parser
      'react', // Required with react rules
      'prettier' // Required with prettier integration
    ],
    settings: {
      react: {
        version: 'detect', // Automatically detects the React version
      },
    },
    rules: {
      'react-refresh/only-export-components': [ // Rule for Fast Refresh
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'warn', // Show prettier violations as warnings
      '@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }], // Warn on unused vars, ignore if prefixed with _
      '@typescript-eslint/no-explicit-any': 'warn', // Warn on explicit 'any'
      'react/prop-types': 'off', // Disable prop-types as we use TypeScript
      // Add any custom rule overrides here
    },
  };