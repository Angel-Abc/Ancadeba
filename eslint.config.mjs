import js from '@eslint/js'
import tseslint from 'typescript-eslint'

const styleRules = {
  quotes: ['error', 'single', { avoidEscape: true }],
  semi: ['error', 'never']
}

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**'
    ]
  },
  {
    extends: [js.configs.recommended],
    files: ['**/*.{js,mjs,cjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      ...styleRules
    }
  },
  {
    extends: [...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      ...styleRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  }
)

