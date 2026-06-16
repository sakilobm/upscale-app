/**
 * KeyboardAvoidingSheet
 *
 * Drop-in replacement for the [ScrollView body + footer] section inside any
 * bottom-sheet Animated.View. The Animated.View (with its enter/exit animation)
 * stays in each parent component; this component handles only the keyboard logic.
 *
 * How it works
 * ─────────────
 * iOS  — KeyboardAvoidingView behavior="padding" adds paddingBottom=kbH to
 *        its internal layout. Children are laid out in (KAV_height - kbH)
 *        space, so the footer's bottom aligns exactly at keyboard_top.
 *        This holds whether the parent is flex-based or content-sized.
 *
 * Android — KAV inside a Modal window does not receive keyboard events from
 *           the OS (modals are separate Android windows). We use
 *           useKeyboardHeight() and add paddingBottom=kbH to the footer so
 *           the action button rises above the keyboard.
 *
 * Requirements on the parent sheet
 * ──────────────────────────────────
 * • The enclosing Animated.View MUST have a maxHeight (e.g. '92%' or
 *   Dimensions.get('window').height * 0.92) so the sheet is constrained.
 * • Do NOT add an outer KeyboardAvoidingView around the Animated.View when
 *   using this component — it would double-apply on iOS.
 *
 * Usage
 * ──────
 *   <Animated.View style={[s.sheet, sheetStyle]}>
 *     <View style={s.handle} />
 *     <Header />
 *
 *     <KeyboardAvoidingSheet
 *       dividerColor={divider}
 *       footer={
 *         <Pressable onPress={handleSave} style={s.btn}>
 *           <AppText>Save</AppText>
 *         </Pressable>
 *       }
 *     >
 *       <TitleField />
 *       <NoteField />
 *     </KeyboardAvoidingSheet>
 *   </Animated.View>
 */

import { type ReactNode } from 'react';
import {
  View, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@hooks/useKeyboardHeight';

interface Props {
  /** Scrollable form content */
  children:      ReactNode;
  /** Fixed footer — typically the primary action button */
  footer?:       ReactNode;
  /** Merged into ScrollView contentContainerStyle */
  contentStyle?: ViewStyle;
  /** Merged into footer container style */
  footerStyle?:  ViewStyle;
  /** Hairline divider color between body and footer */
  dividerColor?: string;
}

export function KeyboardAvoidingSheet({
  children,
  footer,
  contentStyle,
  footerStyle,
  dividerColor,
}: Props) {
  const insets = useSafeAreaInsets();
  const kbH    = useKeyboardHeight();

  // Android: KAV has no effect inside Modal — add paddingBottom manually.
  // When keyboard is visible: button lifts above keyboard.
  // When keyboard is hidden: use device safe-area inset.
  const footerPadBot = Platform.OS === 'android'
    ? Math.max(insets.bottom, 16) + kbH
    : Math.max(insets.bottom, 16);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={s.kav}
    >
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, contentStyle]}
      >
        {children}
      </ScrollView>

      {footer != null && (
        <View style={[
          s.footer,
          dividerColor ? { borderTopColor: dividerColor } : null,
          { paddingBottom: footerPadBot },
          footerStyle,
        ]}>
          {footer}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  kav: {
    // Fills whatever vertical space the parent gives after handle + header.
    // Works for both content-sized parents (short forms) and
    // flex-constrained parents (forms longer than maxHeight).
    flexShrink: 1,
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.15)',
  },
});
