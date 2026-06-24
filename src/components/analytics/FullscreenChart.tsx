/**
 * @file FullscreenChart.tsx
 * @architecture Presentation Layer — UI Component
 * @description Slide-up modal wrapping a full screen chart display.
 */

import React from 'react';
import { View, StyleSheet, Pressable, Modal, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';

interface Props {
  /** Whether the modal is visible */
  visible: boolean;
  /** Close callback trigger */
  onClose: () => void;
  /** Header title of the chart modal */
  title: string;
  /** Chart contents to display inside */
  children: React.ReactNode;
}

export function FullscreenChart({ visible, onClose, title, children }: Props) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        {/* Header bar */}
        <View style={s.header}>
          <AppText variant="headingSM" color={colors.text.primary} style={{ fontWeight: '700', flex: 1 }}>
            {title}
          </AppText>
          <Pressable
            onPress={onClose}
            hitSlop={14}
            style={[s.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
          >
            <Ionicons name="close" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
        {/* Chart area */}
        <View style={s.chartArea}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1 },
  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chartArea: { flex: 1, paddingHorizontal: 12, justifyContent: 'center' },
});
