import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

// プレビュー画面は DoorDetail へリダイレクトして共有UIを使う
export default function ReceiverPreviewRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/calendar?preview=1');
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#fff" />
      <Text style={{ color: '#fff', marginTop: 8 }}>プレビューを開いています...</Text>
    </View>
  );
}
