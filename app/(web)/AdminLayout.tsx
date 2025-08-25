import { ReactNode } from 'react';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.sidebar}>
        <ThemedText type="title" style={styles.sidebarTitle}>
          Admin
        </ThemedText>
        <Link href="/(web)" asChild>
          <ThemedText style={styles.navItem}>Dashboard</ThemedText>
        </Link>
        <Link href="/(web)/users" asChild>
          <ThemedText style={styles.navItem}>Users</ThemedText>
        </Link>
        <Link href="/(web)/complexes" asChild>
          <ThemedText style={styles.navItem}>Complexes</ThemedText>
        </Link>
        <Link href="/(web)/units" asChild>
          <ThemedText style={styles.navItem}>Units</ThemedText>
        </Link>
      </View>
      <View style={styles.main}>
        <View style={styles.topbar}>{title && <ThemedText type="title">{title}</ThemedText>}</View>
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 200,
    backgroundColor: '#f2f2f2',
    padding: 16,
    gap: 8,
  },
  sidebarTitle: {
    marginBottom: 8,
  },
  navItem: {
    paddingVertical: 4,
  },
  main: {
    flex: 1,
  },
  topbar: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  content: {
    padding: 16,
    gap: 16,
  },
});