const tsParser = require('@typescript-eslint/parser')

module.exports = [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.config.{js,cjs,mjs,ts}',
    ],
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // Code Quality
      'no-unused-vars': 'off', // Let TypeScript handle this
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],

      // Code Style
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'always-multiline'],
      indent: ['error', 2, { SwitchCase: 1 }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'arrow-parens': ['error', 'always'],
      'arrow-spacing': 'error',

      // Code Complexity (SOLID principles)
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],
      'max-lines-per-function': [
        'warn',
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      'max-params': ['warn', 4],

      // Best Practices
      'no-duplicate-imports': 'error',
      'no-return-await': 'error',
      'require-await': 'warn',
    },
  },
  // Allow console in logger implementations and server entry points
  {
    files: ['**/logger/**/*.ts', '**/src/index.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  // Relax rules for test files
  {
    files: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'max-lines-per-function': 'off',
      'max-depth': 'off',
    },
  },
]
