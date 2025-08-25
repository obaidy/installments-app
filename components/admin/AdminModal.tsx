import { ReactNode } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export type AdminModalProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  showCloseButton?: boolean;
};

export function AdminModal({ visible, title, onClose, children, showCloseButton = true }: AdminModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            {title && <ThemedText type="title">{title}</ThemedText>}
            {showCloseButton && (
              <TouchableOpacity onPress={onClose}>
                <ThemedText>✕</ThemedText>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.body}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: {
    gap: 12,
  },
});
