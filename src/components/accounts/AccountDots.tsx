/**
 * @file AccountDots.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Pagination dot indicators for the account carousel. Active dot
 *   expands to 20px width; inactive dots are 6px with reduced opacity.
 * @associatedFiles src/app/accounts.tsx
 */

import { View, StyleSheet } from 'react-native';

interface Props {
  count:     number;
  activeIdx: number;
  color:     string;
}

export function AccountDots({ count, activeIdx, color }: Props) {
  return (
    <View style={s.row}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            s.dot,
            i === activeIdx
              ? { width: 20, backgroundColor: color }
              : { width: 6,  backgroundColor: color + '40' },
          ]}
        />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 16, marginBottom: 4 },
  dot: { height: 6, borderRadius: 3 },
});
