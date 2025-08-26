import { Stack } from 'expo-router';
import '../../lib/i18n';
import { I18nManager } from 'react-native';


// Toggle RTL later via settings; default LTR for now
I18nManager.allowRTL(true);


export default function Layout() {
return (
<Stack screenOptions={{ headerShadowVisible: false }}>
<Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
<Stack.Screen name="units/[id]" options={{ title: 'Unit' }} />
<Stack.Screen name="payments/[ref]" options={{ title: 'Payment' }} />
</Stack>
);
}