import '@testing-library/jest-dom'

// Mock fetch globally for tests
global.fetch = vi.fn()

// Mock atob for base64 decoding in tests
global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString('binary'))

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})