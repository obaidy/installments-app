import { StyleProp, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { PrimaryButton, PrimaryButtonProps } from '@/components/form/PrimaryButton';

export type AdminActionButtonProps = PrimaryButtonProps & {
  variant?: 'default' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function AdminActionButton({ variant = 'default', style, ...rest }: AdminActionButtonProps) {
  const theme = useColorScheme() ?? 'light';
  if (variant === 'danger') {
    return <PrimaryButton {...rest} style={[{ backgroundColor: '#EF4444' }, style]} />;
  }
  return <PrimaryButton {...rest} style={style} />;
}
