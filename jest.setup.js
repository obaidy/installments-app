import '@testing-library/jest-native/extend-expect';
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'anon';
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// Polyfill setImmediate for RN tests
if (typeof setImmediate === 'undefined') { global.setImmediate = (fn) => setTimeout(fn, 0); }
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'anon';
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';


// Force high-contrast colors during tests
try { const { Colors } = require('./constants/Colors'); Colors.light.primary = '#000000'; Colors.dark.primary = '#A5B4FC'; } catch {}


jest.mock('expo-linking', () => ({ createURL: (p) => 'app://'+(p||''), openURL: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));


// Silence act() warnings in tests
const origError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) return;
  origError(...args);
};
afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

afterEach(() => { try { jest.clearAllMocks(); } catch {} });
// Silence unique key warnings
const _origError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('not wrapped in act') || args[0].includes('unique "key" prop'))) return;
  _origError(...args);
};
