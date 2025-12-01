import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { FontAwesome5, AntDesign, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithOtp, verifyEmailOtp, signInAnonymously, emailSent, error, session, signInWithOAuth } = useAuth();
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
    if (ok) router.replace('/creator/setup');
  };

  // Avoid auto-redirect loop; navigate only after explicit success
  useEffect(() => {
    if (session) {
      router.replace('/creator/setup');
    }
  }, [session, router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0f172a' }} behavior={Platform.select({ ios: 'padding', android: undefined })}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800' }}>🎄 Couple Advent</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>毎日にワクワクを。二人だけのカレンダー</Text>
        </View>

        {/* OAuth buttons */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          <TouchableOpacity onPress={() => signInWithOAuth('google')} style={{
            width: '100%', backgroundColor: '#fff', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            <AntDesign name="google" size={18} color="#0f172a" />
            <Text style={{ textAlign: 'center', color: '#0f172a', fontWeight: '700' }}>Googleで続行</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Alert.alert('準備中', 'Appleログインは設定中です')}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            <FontAwesome5 name="apple" size={18} color="#fff" />
            <Text style={{ textAlign: 'center', color: '#fff' }}>Appleで続行（準備中）</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <Text style={{ color: 'rgba(255,255,255,0.6)' }}>または</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        </View>
        <TextInput
          placeholder="メールアドレス"
          placeholderTextColor="#94a3b8"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity onPress={onSend} style={{ marginTop: 8, width: '100%', backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>確認コードを送る</Text>
        </TouchableOpacity>
        {emailSent && (
          <View style={{ width: '100%', marginTop: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>メールに届いた6桁コードを入力</Text>
            <TextInput
              placeholder="123456"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
              value={otp}
              onChangeText={setOtp}
            />
            <TouchableOpacity onPress={onVerify} style={{ marginTop: 12, width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, borderRadius: 12 }}>
              <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>コードでログイン</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity onPress={async () => { const ok = await signInAnonymously(); if (ok) router.replace('/creator/setup'); }} style={{ marginTop: 20, width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 10, borderRadius: 12 }}>
          <Text style={{ textAlign: 'center', color: '#fff', fontSize: 12 }}>（開発用）匿名で入る</Text>
        </TouchableOpacity>
        {emailSent && (
          <Text style={{ color: '#86efac', marginTop: 12 }}>{emailSent} にメールを送りました</Text>
        )}
        {error && <Text style={{ color: '#fda4af', marginTop: 12 }}>{error}</Text>}
      </View>
    </KeyboardAvoidingView>
  );
}
