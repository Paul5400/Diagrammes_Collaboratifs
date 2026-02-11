/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^mermaid$': '<rootDir>/__mocks__/mermaid.js',
    '^@monaco-editor/react$': '<rootDir>/__mocks__/monacoEditor.js',
    '^yjs$': '<rootDir>/__mocks__/yjs.js',
    '^y-monaco$': '<rootDir>/__mocks__/yMonaco.js',
    '^@hocuspocus/provider$': '<rootDir>/__mocks__/hocuspocus.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(mermaid|@hocuspocus|yjs|y-monaco)/)',
  ],
};