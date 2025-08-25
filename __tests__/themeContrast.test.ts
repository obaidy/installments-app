import { Colors } from '../constants/Colors';

function hexToLuminance(hex: string) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;
  const [R, G, B] = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrast(hex1: string, hex2: string) {
  const L1 = hexToLuminance(hex1);
  const L2 = hexToLuminance(hex2);
  const [light, dark] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (light + 0.05) / (dark + 0.05);
}

describe('Theme color contrast', () => {
  const MIN_RATIO = 4.5;

  it('light theme text contrasts with background', () => {
    expect(contrast(Colors.light.text, Colors.light.background)).toBeGreaterThanOrEqual(
      MIN_RATIO
    );
  });

  it('dark theme text contrasts with background', () => {
    expect(contrast(Colors.dark.text, Colors.dark.background)).toBeGreaterThanOrEqual(
      MIN_RATIO
    );
  });

  it('light theme link color contrasts with background', () => {
    expect(contrast(Colors.light.primary, Colors.light.background)).toBeGreaterThanOrEqual(
      MIN_RATIO
    );
  });

  it('dark theme link color contrasts with background', () => {
    expect(contrast(Colors.dark.primary, Colors.dark.background)).toBeGreaterThanOrEqual(
      MIN_RATIO
    );
  });
});
