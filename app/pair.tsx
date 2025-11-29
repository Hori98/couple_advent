import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { useRelationship } from '../hooks/useRelationship';

export default function PairScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { relationshipId, inviteCode, loading, error, create, join } = useRelationship();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (relationshipId) router.replace('/calendar');
  }, [relationshipId, router]);

  useEffect(() => {
    if (!session) router.replace('/auth');
  }, [session, router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', padding: 24 }}>
      <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 }}>🤝 ペアリング</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>招待コードで二人をつなげます</Text>

      <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 16 }}>
        <Text style={{ color: '#fff', marginBottom: 8 }}>1) 招待コードを発行（作成者）</Text>
        <TouchableOpacity disabled={loading} onPress={create} style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>招待コードを作成</Text>
        </TouchableOpacity>
        {inviteCode && (
          <Text style={{ color: '#fff', marginTop: 12 }}>招待コード: <Text style={{ fontWeight: '700' }}>{inviteCode}</Text></Text>
        )}
      </View>

      <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
        <Text style={{ color: '#fff', marginBottom: 8 }}>2) コードで参加（閲覧者）</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="コードを入力"
          placeholderTextColor="#94a3b8"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 }}
          autoCapitalize="characters"
        />
        <TouchableOpacity disabled={loading || !code} onPress={() => join(code)} style={{ backgroundColor: '#e11d48', paddingVertical: 12, borderRadius: 12 }}>
          <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>参加する</Text>
        </TouchableOpacity>
      </View>

      {error && <Text style={{ color: '#fda4af', marginTop: 16 }}>{error}</Text>}
    </View>
  );
}
