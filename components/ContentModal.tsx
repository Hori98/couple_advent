import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, Linking } from 'react-native';

export type Content =
  | { type: 'text'; text: string }
  | { type: 'image'; uri: any }
  | { type: 'video'; uri: string }
  | { type: 'audio'; uri: string }
  | { type: 'file'; uri: string; name?: string }
  | { type: 'link'; title?: string; description?: string; url: string; thumbnail?: any };

type Props = {
  visible: boolean;
  onClose: () => void;
  content: Content;
};

export function ContentModal({ visible, onClose, content }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: 'rgba(15,23,42,0.98)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          {content.type === 'text' && (
            <View style={{ padding: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16, lineHeight: 22 }}>{content.text}</Text>
            </View>
          )}
          {content.type === 'image' && (
            <Image source={content.uri} style={{ width: '100%', height: 260, borderRadius: 12 }} resizeMode="contain" />
          )}
          {content.type === 'video' && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#fff', marginBottom: 6 }}>動画（プレビュー）</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>このダイアログでは簡易表示です。ページ表示ではプレーヤー対応します。</Text>
            </View>
          )}
          {content.type === 'audio' && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#fff', marginBottom: 6 }}>音声（プレビュー）</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>このダイアログでは簡易表示です。ページ表示ではプレーヤー対応します。</Text>
            </View>
          )}
          {content.type === 'file' && (
            <View style={{ padding: 16 }}>
              <Text style={{ color: '#fff', marginBottom: 6 }}>{content.name || 'ファイル'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)' }}>外部アプリで開きます。</Text>
            </View>
          )}
          {content.type === 'link' && (
            <View>
              {content.thumbnail && (
                <Image source={content.thumbnail} style={{ width: '100%', height: 160, borderRadius: 12, marginBottom: 8 }} resizeMode="cover" />
              )}
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{content.title || 'リンク'}</Text>
              {content.description && <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{content.description}</Text>}
              <TouchableOpacity onPress={() => Linking.openURL(content.url)} style={{ backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, marginTop: 12 }}>
                <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>開く</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity onPress={onClose} style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 12, borderRadius: 12, marginTop: 12 }}>
            <Text style={{ color: '#fff', textAlign: 'center' }}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
