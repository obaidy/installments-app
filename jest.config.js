module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    transformIgnorePatterns: [
      'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*)'
    ],
  };