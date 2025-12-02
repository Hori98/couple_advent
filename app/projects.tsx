import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useRelationship } from '../hooks/useRelationship';
import { getDrafts, setPreviewSnapshot, deleteDraft, DesignDraft } from '../lib/drafts';

export default function ProjectsScreen() {
  const router = useRouter();
  const { relationshipId } = useRelationship();
  const [drafts, setDrafts] = useState<DesignDraft[] | null>(null);
  const [loading, setLoading] = useState(false);

  const loadDrafts = async () => {
    setLoading(true);
    try {
      const list = await getDrafts();
      setDrafts(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrafts(); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>プロジェクトを選択</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)' }}>新しく作るか、保存済みの下書きから始められます。</Text>

        <View style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/creator/setup')} style={{ backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 12 }}>
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>新規作成</Text>
          </TouchableOpacity>
          {relationshipId ? (
            <TouchableOpacity onPress={() => router.push('/creator')} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 14, borderRadius: 12 }}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>現在のプロジェクトに進む</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ marginTop: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>下書き一覧（最大3件）</Text>
            <TouchableOpacity onPress={loadDrafts} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <Text style={{ color: '#fff' }}>更新</Text>
            </TouchableOpacity>
          </View>
          {loading && (
            <View style={{ paddingVertical: 12, alignItems: 'center' }}>
              <ActivityIndicator color="#fff" />
            </View>
          )}
          {!loading && (drafts?.length ?? 0) === 0 && (
            <Text style={{ color: 'rgba(255,255,255,0.75)' }}>下書きはありません。</Text>
          )}
          {!loading && drafts?.map((d) => (
            <View key={d.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{d.title || '無題'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>更新: {new Date(d.updated_at).toLocaleString()}</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={async () => {
                    await setPreviewSnapshot(d);
                    router.push('/calendar?preview=1');
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}
                >
                  <Text style={{ color: '#fff' }}>プレビュー</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await setPreviewSnapshot(d);
                    router.push('/creator/setup');
                  }}
                  style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}
                >
                  <Text style={{ color: '#fff' }}>復元して編集</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    await deleteDraft(d.id);
                    loadDrafts();
                  }}
                  style={{ backgroundColor: 'rgba(239,68,68,0.9)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}
                >
                  <Text style={{ color: '#fff' }}>削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
