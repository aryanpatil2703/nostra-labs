module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['airbnb', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint'],
  parserOptions: {},
  rules: {
    'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
    '@typescript-eslint/array-type': 'error',
    '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    'import/no-duplicates': ['error', { 'prefer-inline': true }],
    'react/react-in-jsx-scope': 'off', // Injected globally
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/destructuring-assignment': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/control-has-associated-label': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'info',
      { argsIgnorePattern: '^_', ignoreRestSiblings: true },
    ],
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    'default-param-last': 'off',
    '@typescript-eslint/default-param-last': ['error'],
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': ['error'],
    'no-empty-function': 'off',
    '@typescript-eslint/no-empty-function': ['error'],
    'lines-between-class-members': 'off',
    '@typescript-eslint/lines-between-class-members': ['error'],
    // regenerator-runtime on use of for/of
    'no-restricted-syntax': 'off',
    'react/function-component-definition': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'import/order': [
      'error',
      {
        pathGroups: [
          { pattern: '@/**', group: 'internal' },
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'next/**', group: 'external', position: 'before' },
        ],
        groups: [['external', 'builtin'], 'internal', ['sibling', 'parent'], 'index'],
        pathGroupsExcludedImportTypes: ['internal'],
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['numeral'],
            message: 'This package has not been updated in 7 years and contains bugs',
          },
        ],
      },
    ],
    camelcase: 'off',
  },
  ignorePatterns: [
    '**/.node_modules',
    '**/.next',
    '**/_next',
    '**/abis',
    '**/dist',
    '**/.eslintrc.js',
    '**/next.config.js',
    '**/public/static/**',
    '**/vendor/**',
  ],
  globals: {
    vitest: true,
  },
  settings: {
    'import/resolver': {
      typescript: true,
    },
  },
  reportUnusedDisableDirectives: true,
  root: true,
};
