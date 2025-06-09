import React, { createContext, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { ThemedText } from './ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: React.PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const colorScheme = useColorScheme() ?? 'light';

  const show = (msg: string) => {
    setMessage(msg);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setMessage(null));
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {message && (
        <Animated.View
          style={[
            styles.toast,
            { opacity, backgroundColor: Colors[colorScheme].tint },
          ]}
        >
          <ThemedText style={styles.text}>{message}</ThemedText>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#fff',
  },
});