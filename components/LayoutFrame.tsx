import React, { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

type Props = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  backgroundColor?: string;
  footerHeight?: number;
  headerHeight?: number;
};

export function LayoutFrame({
  header,
  footer,
  children,
  backgroundColor = '#0f172a',
  headerHeight = 52,
  footerHeight = 72,
}: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      {/* Header fixed */}
      <View style={{ height: header ? headerHeight : 0, justifyContent: 'center', zIndex: 1 }}>
        {header}
      </View>
      {/* Main content area (reserved space for footer) */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: footer ? footerHeight : 0 }}>
        {children}
      </View>
      {/* Footer fixed */}
      {footer && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: footerHeight, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor, zIndex: 1 }}>
          {footer}
        </View>
      )}
    </SafeAreaView>
  );
}
