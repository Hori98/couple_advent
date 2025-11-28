import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithOtp, verifyEmailOtp, signInAnonymously, emailSent, error, session } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const onSend = async () => {
    if (!email) return;
    const ok = await signInWithOtp(email);
    if (ok) {
      // show message; user will return via magic link
    }
  };

  const onVerify = async () => {
    if (!email || !otp) return;
    const ok = await verifyEmailOtp(email, otp);
    if (ok) router.replace('/pair');
  };

  if (session) {
    router.replace('/pair');
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-christmas-night"
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-white text-4xl font-bold mb-2">🎄 Couple Advent</Text>
        <Text className="text-white/70 mb-6">毎日にワクワクを。二人だけのカレンダー</Text>
        <TextInput
          placeholder="メールアドレス"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity onPress={onSend} className="mt-4 w-full bg-christmas-green py-3 rounded-xl">
          <Text className="text-center text-white font-semibold">マジックリンクを送る</Text>
        </TouchableOpacity>
        {emailSent && (
          <View className="w-full mt-4">
            <Text className="text-white/80 mb-2">メールに届いた6桁コードを入力</Text>
            <TextInput
              placeholder="123456"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              className="w-full bg-white/10 text-white px-4 py-3 rounded-xl border border-white/20"
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity onPress={onVerify} className="mt-3 w-full bg-white/20 py-3 rounded-xl">
              <Text className="text-center text-white font-semibold">コードでログイン</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={async () => { const ok = await signInAnonymously(); if (ok) router.replace('/pair'); }} className="mt-6 w-full bg-white/10 py-3 rounded-xl">
          <Text className="text-center text-white">（開発用）匿名で入る</Text>
        </TouchableOpacity>
        {emailSent && (
          <Text className="text-green-300 mt-3">{emailSent} にメールを送りました</Text>
        )}
        {error && <Text className="text-red-300 mt-3">{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}
