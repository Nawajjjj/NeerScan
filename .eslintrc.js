module.exports = {
  rules: {
      semi: ['error', 'always'], // Enforces semicolons
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
  },
  env: {
    browser: true,
    es6: true,
  },
};
