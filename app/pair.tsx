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

  if (!session) {
    router.replace('/auth');
    return null;
  }

  return (
    <View className="flex-1 bg-christmas-night p-6">
      <Text className="text-white text-3xl font-bold mb-1">🤝 ペアリング</Text>
      <Text className="text-white/70 mb-4">招待コードで二人をつなげます</Text>

      <View className="bg-white/10 p-4 rounded-xl border border-white/10 mb-6">
        <Text className="text-white mb-2">1) 招待コードを発行（作成者）</Text>
        <TouchableOpacity disabled={loading} onPress={create} className="bg-christmas-green py-3 rounded-xl">
          <Text className="text-center text-white font-semibold">招待コードを作成</Text>
        </TouchableOpacity>
        {inviteCode && (
          <Text className="text-white mt-3">招待コード: <Text className="font-bold">{inviteCode}</Text></Text>
        )}
      </View>

      <View className="bg-white/10 p-4 rounded-xl border border-white/10">
        <Text className="text-white mb-2">2) コードで参加（閲覧者）</Text>
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="コードを入力"
          placeholderTextColor="#94a3b8"
          className="bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20 mb-3"
          autoCapitalize="characters"
        />
        <TouchableOpacity
          disabled={loading || !code}
          onPress={() => join(code)}
          className="bg-christmas-red py-3 rounded-xl"
        >
          <Text className="text-center text-white font-semibold">参加する</Text>
        </TouchableOpacity>
      </View>

      {error && <Text className="text-red-300 mt-4">{error}</Text>}
    </View>
  );
}
