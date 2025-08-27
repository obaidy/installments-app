import { ReactNode } from 'react';
import { usePathname, router } from 'expo-router';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  const theme = useColorScheme() ?? 'light';
  const pathname = usePathname();

  const NavItem = ({ href, icon, label }: { href: string; icon: any; label: string }) => {
    const active = pathname === href;
    return (
      <Pressable
        style={StyleSheet.flatten([
          styles.navItem,
          active && { backgroundColor: 'rgba(255,255,255,0.12)' },
        ])}
        accessibilityRole="link"
        onPress={() => router.push(href)}
      >
        <MaterialIcons name={icon} size={18} color="#fff" />
        <ThemedText style={{ marginLeft: 8 }} lightColor="#fff" darkColor="#fff">{label}</ThemedText>
      </Pressable>
    );
  };
  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.sidebar, { backgroundColor: '#0A2540' }]}>
        <ThemedText type="title" style={styles.sidebarTitle} lightColor="#fff" darkColor="#fff">Admin</ThemedText>
        <NavItem href="/(web)" icon="dashboard" label="Dashboard" />
        <NavItem href="/(web)/users" icon="people" label="Users" />
        <NavItem href="/(web)/complexes" icon="domain" label="Complexes" />
        <NavItem href="/(web)/units" icon="apartment" label="Units" />
      </View>
      <View style={styles.main}>
        <View style={[styles.topbar, { borderColor: Colors[theme].icon }]}>
          {title && <ThemedText type="title">{title}</ThemedText>}
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const { signOut } = await import('@/lib/supabaseClient');
              await signOut();
              router.replace('/auth/Login');
            }}
            style={StyleSheet.flatten([styles.signout])}
          >
            <ThemedText lightColor="#fff" darkColor="#fff">Sign out</ThemedText>
          </Pressable>
        </View>
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
    width: 220,
    padding: 16,
    gap: 12,
  },
  sidebarTitle: {
    marginBottom: 8,
  },
  navItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  main: {
    flex: 1,
  },
  topbar: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0A2540',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  signout: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1b2b4b',
  },
});
