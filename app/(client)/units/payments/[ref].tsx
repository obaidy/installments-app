import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getPaymentStatus } from '../../../../lib/api/payments';


export default function PaymentStatusScreen() {
const { ref } = useLocalSearchParams<{ ref: string }>();
const [status, setStatus] = useState<'pending'|'paid'|'failed'|'cancelled'>('pending');


useEffect(() => {
let t: any; let isMounted = true;
const poll = async () => {
if (!ref) return;
const s = await getPaymentStatus(ref);
if (isMounted) setStatus(s);
if (s === 'pending') t = setTimeout(poll, 2000);
};
poll();
return () => { isMounted = false; if (t) clearTimeout(t); };
}, [ref]);


return (
<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
{status === 'pending' && (<>
<ActivityIndicator />
<Text style={{ marginTop: 12 }}>Processing payment…</Text>
</>)}
{status === 'paid' && <Text style={{ fontSize: 18, fontWeight: '700', color: '#166534' }}>Payment succeeded ✅</Text>}
{status === 'failed' && <Text style={{ fontSize: 18, fontWeight: '700', color: '#991B1B' }}>Payment failed ❌</Text>}
{status === 'cancelled' && <Text style={{ fontSize: 18, fontWeight: '700', color: '#374151' }}>Payment cancelled</Text>}
</View>
);
}