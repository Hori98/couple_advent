import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#fff',
            headerTitleStyle: { color: '#fff' },
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ title: 'Welcome', headerShown: true }} />
          <Stack.Screen name="auth" options={{ title: 'Sign in' }} />
          <Stack.Screen name="pair" options={{ title: 'Pair' }} />
          <Stack.Screen name="calendar" options={{ title: 'Advent Calendar' }} />
          <Stack.Screen name="creator/index" options={{ title: 'カレンダー作成' }} />
          <Stack.Screen name="creator/setup" options={{ title: 'Setup' }} />
          <Stack.Screen name="creator/preview" options={{ title: 'Preview' }} />
          <Stack.Screen name="preview" options={{ title: '受け手プレビュー' }} />
          <Stack.Screen name="creator/share" options={{ title: 'Share' }} />
          <Stack.Screen name="door/[day]" options={{ title: 'Door' }} />
        </Stack>
        <StatusBar style="light" />
      </SafeAreaView>
    </View>
  );
}
