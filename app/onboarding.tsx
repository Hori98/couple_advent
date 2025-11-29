import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useFirstRun } from '../hooks/useFirstRun';

export default function Onboarding() {
  const router = useRouter();
  const { markSeen } = useFirstRun();

  const goCreate = async () => {
    await markSeen();
    router.replace('/auth');
  };

  const goOpen = async () => {
    await markSeen();
    // 共有リンクは外部から開く想定。ヒントだけ出してホームへ。
    router.replace('/pair');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a', padding: 24 }}>
      <View style={{ alignItems: 'center', marginTop: 48 }}>
        <Text style={{ fontSize: 32, color: '#fff', fontWeight: '800' }}>🎄 Couple Advent</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 12, textAlign: 'center' }}>
          二人だけのアドベントカレンダーを作って、毎日ひとつのワクワクを贈ろう。
        </Text>
      </View>

      <View style={{ marginTop: 40 }}>
        {[{
          title: '✨ 14 / 24 / 30日の中から選択',
          desc: '当日まで開封ロック（JST）＆未開封は繰越OK'
        },{
          title: '💌 写真 / テキスト / リンク',
          desc: '旅行やギフトのURLも可愛く届けられる'
        },{
          title: '🔗 共有はワンタップ',
          desc: '受け取る側は未登録のまま開封できます'
        }].map((c, i) => (
          <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>{c.title}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{c.desc}</Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 40 }}>
        <TouchableOpacity onPress={goCreate} style={{ backgroundColor: '#16a34a', paddingVertical: 16, borderRadius: 16 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700', fontSize: 16 }}>アドベントを作る</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goOpen} style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 16, borderRadius: 16, marginTop: 12 }}>
          <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>共有リンクを開く</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
