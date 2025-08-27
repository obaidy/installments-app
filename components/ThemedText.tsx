import { StyleSheet, Text, type TextProps } from 'react-native';

import { fonts } from '../constants/design';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const textColor = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({ light: lightColor, dark: darkColor }, 'primary');
  const color = type === 'link' ? linkColor : textColor;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.interRegular,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.interSemiBold,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: fonts.poppinsBold,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: fonts.poppinsSemiBold,
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    fontFamily: fonts.interRegular,
  },
});
