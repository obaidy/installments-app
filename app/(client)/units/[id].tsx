import { useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';


export default function UnitDetails() {
const { id } = useLocalSearchParams<{ id: string }>();
return (
<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
<Text style={{ fontSize: 18, fontWeight: '700' }}>Unit {id}</Text>
{/* TODO: fetch installments for this unit and reuse <InstallmentCard /> */}
</View>
);
}