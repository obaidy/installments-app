module.exports = { useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}), router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } };
