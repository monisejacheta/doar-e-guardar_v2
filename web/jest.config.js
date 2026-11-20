module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.js'],
  collectCoverageFrom: [
    'public/js/**/*.js',
    '!public/js/auth.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  transform: {
    'accessibility\\.js$': '<rootDir>/tests/helpers/accessibilityTransformer.js',
  },
};
