import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, I18nManager } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { signOut } from '../lib/supabaseClient';
import { setAppLanguage, type AppLanguage } from '../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClientHeader({ title, insetTop = true }: { title?: string; insetTop?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const insets = useSafeAreaInsets();

  const Item = ({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={() => { setOpen(false); onPress(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
      <Ionicons name={icon} size={20} color="#111827" />
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );

  function changeLang(lang: AppLanguage) {
    setAppLanguage(lang);
  }

  const padTop = insetTop ? insets.top : 0;
  return (
    <View style={{ paddingTop: padTop, paddingHorizontal: 16, paddingBottom: 8, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent' }}>
      <TouchableOpacity onPress={() => setOpen(true)} accessibilityLabel="menu">
        <Ionicons name="menu-outline" size={26} color="#111827" />
      </TouchableOpacity>
      {title ? <Text style={{ fontSize: 18, fontWeight: '700' }}>{title}</Text> : <View />}
      {/* Right spacer to balance the menu icon */}
      <View style={{ width: 26 }} />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={{ position: 'absolute', top: 0, bottom: 0, left: isRTL ? undefined : 0, right: isRTL ? 0 : undefined, width: '78%', backgroundColor: 'white', paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 6 }}>{t('dashboard')}</Text>
            <Item icon="home-outline" label={t('dashboard')} onPress={() => router.replace('/(client)/dashboard')} />
            <Item icon="card-outline" label={t('paymentMethods')} onPress={() => router.push('/(client)/payment-methods')} />
            <Item icon="time-outline" label={t('upcomingDues')} onPress={() => router.push('/payments/upcoming')} />
            <Item icon="receipt-outline" label={t('paymentHistory')} onPress={() => router.push('/payments/history')} />
            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 }} />
            <Text style={{ fontWeight: '600', color: '#6B7280' }}>{t('language')}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
              <LangButton label="العربية" active={i18n.language === 'ar'} onPress={() => changeLang('ar')} />
              <LangButton label="English" active={i18n.language === 'en'} onPress={() => changeLang('en')} />
              <LangButton label="کوردی" active={i18n.language === 'ku'} onPress={() => changeLang('ku')} />
            </View>
            <View style={{ height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 }} />
            <Item icon="log-out-outline" label={t('logout')} onPress={async () => { await signOut(); router.replace('/auth/Login'); }} />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function LangButton({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: active ? '#111827' : '#F3F4F6' }}>
      <Text style={{ color: active ? 'white' : '#111827', fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
