import { useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Platform, Dimensions } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_OPTIONS } from '@features/onboarding/hooks/useOnboardingScreen';
import { AVATAR_PRESETS, getAvatar } from '@constants/avatars';
import type { CurrencyCode } from '@store/types';

const { width: SW } = Dimensions.get('window');

interface Props {
  name:             string;
  currency:         CurrencyCode;
  avatarId:         string;
  onNameChange:     (v: string) => void;
  onCurrencyChange: (c: CurrencyCode) => void;
  onAvatarChange:   (id: string) => void;
  animKey:          number;
}

export function SetupSlide({
  name, currency, avatarId,
  onNameChange, onCurrencyChange, onAvatarChange,
  animKey,
}: Props) {
  const { colors, isDark } = useTheme();
  const inputRef    = useRef<TextInput>(null);
  const scrollRef   = useRef<ScrollView>(null);
  const nameFieldY  = useRef(0);
  const avatar      = getAvatar(avatarId);

  // Spring-pop the preview whenever avatar changes
  const avatarScale = useSharedValue(1);
  const avatarAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  function handleAvatarChange(id: string) {
    avatarScale.value = 0.78;
    avatarScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    onAvatarChange(id);
  }

  // Scroll to keep the name input visible when keyboard opens
  function handleInputFocus() {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: nameFieldY.current - 12, animated: true });
    }, 180);
  }

  const inputBg     = colors.surface.input;
  const inputBorder = colors.glass.border;
  const accent      = avatar.gradient[0];

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1 }}
      contentContainerStyle={s.root}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* ── Large avatar preview ── */}
      <Animated.View
        key={`hero-${animKey}`}
        entering={FadeInDown.springify().damping(20).stiffness(140)}
        style={s.heroSection}
      >
        {/* Fixed 110×110 container so the absolute orbit ring centers correctly */}
        <Animated.View style={[s.avatarContainer, avatarAnimStyle]}>
          <View style={[s.orbitRing, { borderColor: accent + '55' }]} />
          <LinearGradient
            colors={avatar.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.avatarCircle, { shadowColor: colors.black }]}
          >
            <Text style={s.avatarEmoji}>{avatar.emoji}</Text>
          </LinearGradient>
          <View style={[s.editBadge, { backgroundColor: accent, shadowColor: colors.black }]}>
            <Ionicons name="pencil" size={10} color={colors.white} />
          </View>
        </Animated.View>

        <AppText variant="caption" color={colors.text.tertiary} style={{ marginTop: 8 }}>
          Choose your character
        </AppText>
      </Animated.View>

      {/* ── Avatar picker row ── */}
      <Animated.View
        key={`picker-${animKey}`}
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(50)}
        style={s.pickerWrap}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.pickerRow}
          nestedScrollEnabled
        >
          {AVATAR_PRESETS.map((preset) => {
            const active = preset.id === avatarId;
            return (
              <Pressable
                key={preset.id}
                onPress={() => handleAvatarChange(preset.id)}
                style={({ pressed }) => [
                  s.pickerItemWrap,
                  {
                    borderColor: active ? preset.gradient[0] : 'transparent',
                    opacity:     pressed ? 0.7 : (active ? 1 : 0.5),
                    transform:   [{ scale: active ? 1.1 : 1 }],
                    backgroundColor: 'transparent',
                    ...(active ? Platform.select({
                      ios: {
                        shadowColor: colors.black,
                        shadowOffset:  { width: 0, height: 3 },
                        shadowOpacity: 0.15,
                        shadowRadius:  5,
                      },
                      android: { elevation: 3 },
                    }) : {}),
                  },
                ]}
              >
                <LinearGradient
                  colors={preset.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.pickerCircle}
                >
                  <Text style={s.pickerEmoji}>{preset.emoji}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Heading ── */}
      <Animated.View
        key={`head-${animKey}`}
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(100)}
        style={s.headBlock}
      >
        <AppText variant="headingLG" color={colors.text.primary} align="center" style={s.title}>
          Almost there!
        </AppText>
        <AppText variant="bodyMD" color={colors.text.secondary} align="center">
          Tell us your name to personalise the experience.
        </AppText>
      </Animated.View>

      {/* ── Name input ── */}
      <Animated.View
        key={`name-${animKey}`}
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(150)}
        style={s.fieldBlock}
        onLayout={(e) => { nameFieldY.current = e.nativeEvent.layout.y; }}
      >
        <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>
          Your Name
        </AppText>
        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={[
            s.inputWrap,
            {
              backgroundColor: inputBg,
              borderColor:     name.length > 0 ? accent + '80' : inputBorder,
              shadowColor:     colors.black,
            },
          ]}
        >
          <Ionicons
            name="person-outline"
            size={18}
            color={name.length > 0 ? accent : colors.text.tertiary}
          />
          <TextInput
            ref={inputRef}
            style={[s.input, { color: colors.text.primary }]}
            value={name}
            onChangeText={onNameChange}
            onFocus={handleInputFocus}
            placeholder="e.g. Alex Johnson"
            placeholderTextColor={colors.text.tertiary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
          />
          {name.length > 0 && (
            <Pressable onPress={() => onNameChange('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={colors.text.tertiary} />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>

      {/* ── Currency ── */}
      <Animated.View
        key={`curr-${animKey}`}
        entering={FadeInDown.springify().damping(20).stiffness(140).delay(200)}
        style={s.fieldBlock}
      >
        <AppText variant="labelMD" color={colors.text.secondary} style={s.fieldLabel}>
          Base Currency
        </AppText>
        <View style={s.currencyGrid}>
          {CURRENCY_OPTIONS.map(({ code, symbol, name: currencyName }, index) => {
            const active = currency === code;
            const isLast = index === CURRENCY_OPTIONS.length - 1;
            return (
              <Pressable
                key={code}
                onPress={() => onCurrencyChange(code)}
                style={({ pressed }) => [
                  s.currencyChip,
                  isLast && s.currencyChipLast,
                  {
                    backgroundColor: active ? accent + '0D' : inputBg,
                    borderColor:     active ? accent : inputBorder,
                    opacity:         pressed ? 0.85 : 1,
                    shadowColor:     active ? accent : 'transparent',
                    shadowOpacity:   active ? 0.12 : 0,
                  },
                ]}
              >
                <View style={[
                  s.currencySymbolCircle,
                  {
                    backgroundColor: active ? accent : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                  }
                ]}>
                  <Text style={[
                    s.currencySymbol,
                    {
                      color: active ? colors.white : colors.text.secondary,
                    }
                  ]}>
                    {symbol}
                  </Text>
                </View>
                <View style={s.currencyDetails}>
                  <AppText style={[
                    s.currencyCode,
                    {
                      color: active ? colors.text.primary : colors.text.secondary,
                      fontWeight: active ? '700' : '600',
                    }
                  ]}>
                    {code}
                  </AppText>
                  <AppText
                    variant="caption"
                    style={{
                      color: active ? accent : colors.text.tertiary,
                      fontSize: 10,
                      fontWeight: '500',
                    }}
                    numberOfLines={1}
                  >
                    {currencyName}
                  </AppText>
                </View>
                {active && (
                  <View style={[s.checkBadge, { backgroundColor: accent, borderColor: colors.background.primary }]}>
                    <Ionicons name="checkmark" size={10} color={colors.white} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems:       'center',
    paddingHorizontal: 24,
    paddingTop:        16,
    paddingBottom:     32,
    gap:               20,
  },

  // ── Hero ──
  heroSection: { alignItems: 'center' },

  // Fixed 110×110 so orbit ring (also 110×110, position:absolute) sits at (0,0) = perfectly centered
  avatarContainer: {
    width:          110,
    height:         110,
    alignItems:     'center',
    justifyContent: 'center',
  },
  orbitRing: {
    position:     'absolute',
    top:           0,
    left:          0,
    width:         110,
    height:        110,
    borderRadius:  55,
    borderWidth:   1.5,
    borderStyle:   'dashed',
  },
  avatarCircle: {
    width:          90,
    height:         90,
    borderRadius:   45,
    alignItems:     'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 12 },
        shadowOpacity: 0.32,
        shadowRadius:  20,
      },
      android: { elevation: 14 },
    }),
  },
  avatarEmoji: { fontSize: 46, lineHeight: 56, textAlign: 'center' },
  editBadge: {
    position:       'absolute',
    bottom:          4,
    right:           4,
    width:           26,
    height:          26,
    borderRadius:    9,
    alignItems:     'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius:  6,
      },
      android: { elevation: 6 },
    }),
  },

  // ── Picker ──
  pickerWrap: { alignSelf: 'stretch' },
  pickerRow: {
    flexDirection:    'row',
    paddingHorizontal: 4,
    paddingVertical:   6,
    gap:               10,
  },
  pickerItemWrap: {
    borderWidth:  2.5,
    borderRadius: 18,
    padding:       3,
  },
  pickerCircle: {
    width:          52,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pickerEmoji: { fontSize: 26, lineHeight: 34, textAlign: 'center' },

  // ── Heading ──
  headBlock: { alignItems: 'center', gap: 6 },
  title:     { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },

  // ── Fields ──
  fieldBlock: { alignSelf: 'stretch', gap: 8 },
  fieldLabel: { letterSpacing: 0.3 },
  inputWrap: {
    flexDirection:    'row',
    alignItems:       'center',
    gap:               12,
    paddingHorizontal: 16,
    height:            52,
    borderRadius:      16,
    borderWidth:       1.5,
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius:  8,
      },
      android: { elevation: 2 },
    }),
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0 },

  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  currencyChip: {
    flexDirection:  'row',
    alignItems:     'center',
    width:          (SW - 24 * 2 - 10) / 2,
    height:         60,
    borderRadius:    16,
    borderWidth:     1.5,
    paddingHorizontal: 12,
    gap:             10,
    position:        'relative',
  },
  currencyChipLast: {
    width: SW - 24 * 2,
  },
  currencySymbolCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 15,
    fontWeight: '700',
  },
  currencyDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  currencyCode: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  checkBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
