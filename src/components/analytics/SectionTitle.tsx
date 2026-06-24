/**
 * @file SectionTitle.tsx
 * @architecture Presentation Layer — UI Component
 * @description Small, uppercase stylized header for analytics dashboard sections.
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing } from '@constants/index';

interface Props {
  /** Text content of the section title */
  title: string;
}

export function SectionTitle({ title }: Props) {
  const { colors } = useTheme();
  return (
    <AppText style={[s.sectionTitle, { color: colors.text.tertiary }]}>
      {title}
    </AppText>
  );
}

const s = StyleSheet.create({
  sectionTitle: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingLeft: 4,
    marginTop: Spacing['2'],
  },
});
