import { ReactNode, useState } from 'react';
import { usePathname, router } from 'expo-router';
import { StyleSheet, View, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  const theme = useColorScheme() ?? 'light';
  const pathname = usePathname();
  const { width, height } = useWindowDimensions();
  const isSmall = width < 768;
  const [navOpen, setNavOpen] = useState(false);

  const NavItem = ({ href, icon, label }: { href: string; icon: any; label: string }) => {
    const active = pathname === href;
    return (
      <Pressable
        style={({ pressed }) => StyleSheet.flatten([
          styles.navItem,
          active && styles.navActive,
          pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[theme].background }} edges={['top']}>
    <View style={[styles.container, { flexDirection: isSmall ? 'column' : 'row' }]}> 
      {/* Sidebar (persistent on large screens, overlay on small) */}
      {!isSmall && (
        <View style={[styles.sidebar, { backgroundColor: '#0A2540', width: 220 }]}>
          <ThemedText type="title" style={styles.sidebarTitle} lightColor="#fff" darkColor="#fff">Admin</ThemedText>
          <NavItem href="/(web)" icon="dashboard" label="Dashboard" />
          <NavItem href="/(web)/users" icon="people" label="Users" />
          <NavItem href="/(web)/complexes" icon="domain" label="Complexes" />
          <NavItem href="/(web)/units" icon="apartment" label="Units" />
        </View>
      )}

      <View style={styles.main}>
        <View style={[styles.topbar, { borderColor: Colors[theme].icon }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {isSmall && (
              <Pressable onPress={() => setNavOpen(true)} accessibilityRole="button" style={styles.iconBtn}>
                <MaterialIcons name="menu" size={22} color="#fff" />
              </Pressable>
            )}
            {title && <ThemedText type="title" lightColor="#fff" darkColor="#fff">{title}</ThemedText>}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              const { signOut } = await import('../../lib/supabaseClient');
              await signOut();
              router.replace('/auth/Login');
            }}
            style={StyleSheet.flatten([styles.signout])}
          >
            <ThemedText lightColor="#fff" darkColor="#fff">Sign out</ThemedText>
          </Pressable>
        </View>
        <View style={[styles.content, isSmall && { padding: 12 }]}>{children}</View>
      </View>

      {/* Overlay sidebar for small screens */}
      {isSmall && navOpen && (
        <View style={[styles.overlay, { height }]}> 
          <Pressable style={StyleSheet.absoluteFill as any} onPress={() => setNavOpen(false)} />
          <View style={[styles.sidebar, { backgroundColor: '#0A2540', width: Math.min(300, width * 0.8) }]}> 
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <ThemedText type="title" style={styles.sidebarTitle} lightColor="#fff" darkColor="#fff">Admin</ThemedText>
              <Pressable onPress={() => setNavOpen(false)} accessibilityRole="button" style={styles.iconBtn}>
                <MaterialIcons name="close" size={22} color="#fff" />
              </Pressable>
            </View>
            <NavItem href="/(web)" icon="dashboard" label="Dashboard" />
            <NavItem href="/(web)/users" icon="people" label="Users" />
            <NavItem href="/(web)/complexes" icon="domain" label="Complexes" />
            <NavItem href="/(web)/units" icon="apartment" label="Units" />
          </View>
        </View>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
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
  navActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    flex: 1,
  },
  signout: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#1b2b4b',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
});
