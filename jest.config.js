module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*)'
  ],
  testPathIgnorePatterns: ['/__tests__/server/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@installments/tokens$': '<rootDir>/packages/tokens/src/index.ts',
    '^@installments/config$': '<rootDir>/packages/config/src/index.ts',
    '^@installments/db-types/(.*)$': '<rootDir>/packages/db-types/src/$1',
    '^@expo/vector-icons/MaterialIcons$': '<rootDir>/__mocks__/EmptyComponent.js',
    '^expo-font$': '<rootDir>/__mocks__/noop.js',
    '^expo-router$': '<rootDir>/__mocks__/expoRouter.js',
    '^react-native-webview$': '<rootDir>/__mocks__/EmptyComponent.js'
  },
};

