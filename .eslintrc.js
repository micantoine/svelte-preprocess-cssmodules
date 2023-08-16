module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier',
    'prettier/@typescript-eslint'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'comma-dangle': ['error', "only-multiline"],
    'import/extensions': [
      'error',
      'never',
      {
        ignorePackages: true
      }
    ],
    'lines-between-class-members': [
      'error',
      'always',
      {
        exceptAfterSingleLine: true
      }
    ],
    'no-const-assign': 'error'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.d.ts']
      }
    }
  }
};
