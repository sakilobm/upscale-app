import { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

// ─── Layout constants ─────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');
const ORB_SIZE        = 92;
const ORB_RAD         = 28;
const PROGRESS_WIDTH  = SW - 80;
const LETTER_STAGGER  = 52;
const LETTER_DELAY    = 500;
const ANIM_TOTAL_MS   = 2150;
const EXIT_DURATION   = 440;
const APP_LETTERS     = 'WhereCash'.split('');

// ─── Theme palettes ───────────────────────────────────────────────────────────

const DARK = {
  bg:          '#050A12',
  bgGrad:      ['#050A12', '#070C16', '#060910'] as const,
  orbGrad:     ['#9D95FF', '#6C63FF', '#4540CC'] as const,
  orbShine:    ['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.00)'] as const,
  brand:       '#6C63FF',
  accent:      '#38BDF8',
  nameLetter:  '#FFFFFF',
  tagline:     '#4E5C7A',
  version:     '#1E2A3E',
  progressBg:  'rgba(255,255,255,0.06)',
  orbShadow:   'rgba(0,0,0,0.20)',
  orbDotBg:    '#050A12',
  bgOrbTR:     '#6C63FF18',
  bgOrbBL:     '#38BDF818',
  bgOrbCenter: '#6C63FF0A',
  pulseRing:   '#6C63FF80',
  ring1:       '#6C63FF28',
  ring2:       '#38BDF818',
  glowL3:      '#6C63FF08',
  glowL2:      '#6C63FF12',
  glowL1:      '#6C63FF1A',
};

const LIGHT = {
  bg:          '#F4F6FF',
  bgGrad:      ['#F0F3FF', '#F5F7FF', '#EEF1FF'] as const,
  orbGrad:     ['#9D95FF', '#6C63FF', '#4540CC'] as const,
  orbShine:    ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.00)'] as const,
  brand:       '#6C63FF',
  accent:      '#38BDF8',
  nameLetter:  '#0F172A',
  tagline:     '#94A3B8',
  version:     '#CBD5E1',
  progressBg:  'rgba(0,0,0,0.07)',
  orbShadow:   'rgba(0,0,0,0.12)',
  orbDotBg:    '#F4F6FF',
  bgOrbTR:     '#6C63FF14',
  bgOrbBL:     '#38BDF812',
  bgOrbCenter: '#6C63FF08',
  pulseRing:   '#6C63FF60',
  ring1:       '#6C63FF20',
  ring2:       '#38BDF814',
  glowL3:      '#6C63FF07',
  glowL2:      '#6C63FF0E',
  glowL1:      '#6C63FF16',
};

interface Palette {
  bg:          string;
  bgGrad:      readonly [string, string, string];
  orbGrad:     readonly [string, string, string];
  orbShine:    readonly [string, string];
  brand:       string;
  accent:      string;
  nameLetter:  string;
  tagline:     string;
  version:     string;
  progressBg:  string;
  orbShadow:   string;
  orbDotBg:    string;
  bgOrbTR:     string;
  bgOrbBL:     string;
  bgOrbCenter: string;
  pulseRing:   string;
  ring1:       string;
  ring2:       string;
  glowL3:      string;
  glowL2:      string;
  glowL1:      string;
}

// ─── Particle config factory (module-level, accepts theme colors) ─────────────

interface ParticleConfig {
  ox: number; oy: number; delay: number; size: number; color: string;
}

function buildParticles(brand: string, accent: string): ParticleConfig[] {
  return [
    { ox: -90,  oy: 170, delay: 280, size: 5, color: brand  + 'CC' },
    { ox:  55,  oy: 200, delay: 460, size: 4, color: accent + 'BB' },
    { ox: -25,  oy: 145, delay: 160, size: 6, color: brand  + '88' },
    { ox:  115, oy: 185, delay: 390, size: 3, color: '#A78BFA99'    },
    { ox: -115, oy: 125, delay: 265, size: 4, color: accent + '77' },
    { ox:  35,  oy: 160, delay: 580, size: 3, color: brand  + '55' },
  ];
}

// ─── Animation hook ───────────────────────────────────────────────────────────

function useSplashAnimation(onDismissRef: React.RefObject<() => void>) {
  const ringS  = useSharedValue(0.55);
  const ringOp = useSharedValue(0);
  const orbSc  = useSharedValue(0);
  const orbOp  = useSharedValue(0);
  const subOp  = useSharedValue(0);
  const subY   = useSharedValue(10);
  const barW   = useSharedValue(0);
  const exitOp = useSharedValue(1);
  const exitSc = useSharedValue(1);

  useEffect(() => {
    // Decorative ring expands in
    ringOp.value = withDelay(120, withTiming(1, { duration: 350 }));
    ringS.value  = withDelay(120, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));

    // Logo orb springs in
    orbOp.value = withDelay(220, withTiming(1, { duration: 300 }));
    orbSc.value = withDelay(220, withSpring(1, { damping: 11, stiffness: 170 }));

    // Tagline slides up
    subOp.value = withDelay(950, withTiming(1, { duration: 450 }));
    subY.value  = withDelay(950, withSpring(0,  { damping: 18, stiffness: 200 }));

    // Progress bar fills
    barW.value = withDelay(320, withTiming(1, { duration: 1550, easing: Easing.inOut(Easing.quad) }));

    // Schedule exit animation — plain timer avoids worklet/JS thread boundary crash
    const exitTimer = setTimeout(() => {
      exitOp.value = withTiming(0, { duration: EXIT_DURATION, easing: Easing.in(Easing.cubic) });
      exitSc.value = withTiming(1.08, { duration: EXIT_DURATION });
    }, ANIM_TOTAL_MS);

    // Schedule dismiss after exit animation completes — safe: runs on JS thread
    const dismissTimer = setTimeout(
      () => onDismissRef.current?.(),
      ANIM_TOTAL_MS + EXIT_DURATION,
    );

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(dismissTimer);
    };
  }, []); // runs once on mount only

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringS.value }],
    opacity: ringOp.value,
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbSc.value }],
    opacity: orbOp.value,
  }));

  const subStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: subY.value }],
    opacity: subOp.value,
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: barW.value * PROGRESS_WIDTH,
  }));

  const rootStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exitSc.value }],
    opacity: exitOp.value,
  }));

  return { ringStyle, orbStyle, subStyle, barStyle, rootStyle };
}

// ─── NameLetter ───────────────────────────────────────────────────────────────

interface NameLetterProps { char: string; delay: number; color: string; }

function NameLetter({ char, delay, color }: NameLetterProps) {
  const ty = useSharedValue(-22);
  const sc = useSharedValue(0.7);
  const op = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(delay, withSpring(0, { damping: 13, stiffness: 230 }));
    sc.value = withDelay(delay, withSpring(1, { damping: 13, stiffness: 230 }));
    op.value = withDelay(delay, withTiming(1, { duration: 160 }));
  }, []);

  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { scale: sc.value }],
    opacity: op.value,
  }));

  return (
    <Animated.Text style={[styles.nameLetter, { color }, letterStyle]}>
      {char}
    </Animated.Text>
  );
}

// ─── Particle ─────────────────────────────────────────────────────────────────

function Particle({ ox, oy, delay, size, color }: ParticleConfig) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const op = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(delay, withTiming(-oy, { duration: 2400, easing: Easing.out(Easing.quad) }));
    tx.value = withDelay(delay, withTiming(ox * 0.25, { duration: 2400, easing: Easing.inOut(Easing.sin) }));
    op.value = withDelay(delay, withSequence(
      withTiming(0.8, { duration: 300 }),
      withTiming(0.5, { duration: 1500 }),
      withTiming(0,   { duration: 600 }),
    ));
  }, []);

  const particleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: color,
          left: SW / 2 + ox - size / 2,
          top:  SH * 0.5,
        },
        particleStyle,
      ]}
    />
  );
}

// ─── PulseRing ────────────────────────────────────────────────────────────────

interface PulseRingProps { delay: number; color: string; }

function PulseRing({ delay, color }: PulseRingProps) {
  const sc = useSharedValue(1);
  const op = useSharedValue(0);

  useEffect(() => {
    sc.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1,   { duration: 0 }),
        withTiming(2.4, { duration: 1000, easing: Easing.out(Easing.quad) }),
      ), 3, false,
    ));
    op.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.5, { duration: 0 }),
        withTiming(0,   { duration: 1000 }),
      ), 3, false,
    ));
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sc.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View style={[styles.pulseRing, { borderColor: color }, pulseStyle]} />
  );
}

// ─── Render helpers (defined outside component — no inline closures) ──────────

function renderLetter(T: Palette, char: string, index: number) {
  return (
    <NameLetter
      key={index}
      char={char}
      delay={LETTER_DELAY + index * LETTER_STAGGER}
      color={T.nameLetter}
    />
  );
}

function renderParticle(p: ParticleConfig, index: number) {
  return <Particle key={index} {...p} />;
}

// ─── SplashOverlay ────────────────────────────────────────────────────────────

export interface SplashOverlayProps {
  isDark?:   boolean;
  onDismiss: () => void;
}

export function SplashOverlay({ isDark = false, onDismiss }: SplashOverlayProps) {
  const T = isDark ? DARK : LIGHT;

  // Stable ref so the animation hook never stales-closes over onDismiss
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const particles = useMemo(
    () => buildParticles(T.brand, T.accent),
    [isDark],
  );

  const { ringStyle, orbStyle, subStyle, barStyle, rootStyle } =
    useSplashAnimation(onDismissRef);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: T.bg }, rootStyle]}
    >
      {/* Background gradient */}
      <LinearGradient colors={T.bgGrad} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />

      {/* Atmospheric orbs */}
      <View style={[styles.bgOrbTR,     { backgroundColor: T.bgOrbTR     }]} />
      <View style={[styles.bgOrbBL,     { backgroundColor: T.bgOrbBL     }]} />
      <View style={[styles.bgOrbCenter, { backgroundColor: T.bgOrbCenter }]} />

      {/* Particles */}
      {particles.map(renderParticle)}

      {/* Center stage */}
      <View style={styles.center}>
        <PulseRing delay={480} color={T.pulseRing} />
        <PulseRing delay={680} color={T.pulseRing} />

        <Animated.View style={[styles.ring1, { borderColor: T.ring1 }, ringStyle]} />
        <Animated.View style={[styles.ring2, { borderColor: T.ring2 }, ringStyle]} />

        <Animated.View style={[styles.glowL3, { backgroundColor: T.glowL3 }, orbStyle]} />
        <Animated.View style={[styles.glowL2, { backgroundColor: T.glowL2 }, orbStyle]} />
        <Animated.View style={[styles.glowL1, { backgroundColor: T.glowL1 }, orbStyle]} />

        {/* Logo orb */}
        <Animated.View style={[styles.orbWrap, { shadowColor: T.brand }, orbStyle]}>
          <LinearGradient
            colors={T.orbGrad}
            start={GRAD_START}
            end={GRAD_END}
            style={styles.orb}
          >
            <LinearGradient
              colors={T.orbShine}
              start={SHINE_START}
              end={SHINE_END}
              style={styles.orbShine}
            />
            <View style={[styles.orbShadow, { backgroundColor: T.orbShadow }]} />
            <Ionicons name="wallet" size={42} color="#FFFFFF" />
          </LinearGradient>

          <View style={[styles.orbDot, { backgroundColor: T.orbDotBg }]}>
            <View style={[styles.orbDotInner, { backgroundColor: T.accent }]} />
          </View>
        </Animated.View>

        {/* App name — letter by letter */}
        <View style={styles.nameRow}>
          {APP_LETTERS.map((char, i) => renderLetter(T, char, i))}
        </View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineRow, subStyle]}>
          <View style={[styles.taglineDot, { backgroundColor: T.brand + '90' }]} />
          <Animated.Text style={[styles.tagline, { color: T.tagline }]}>
            Track smarter · Spend wiser
          </Animated.Text>
          <View style={[styles.taglineDot, { backgroundColor: T.brand + '90' }]} />
        </Animated.View>
      </View>

      {/* Version */}
      <Animated.Text style={[styles.version, { color: T.version }, subStyle]}>
        v1.0
      </Animated.Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: T.progressBg }]}>
        <Animated.View style={[styles.progressFill, barStyle]}>
          <LinearGradient
            colors={[T.brand, '#8B7FF5', T.accent]}
            start={BAR_START}
            end={BAR_END}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.progressShimmer} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Gradient direction constants (module-level — no inline objects) ──────────

const GRAD_START  = { x: 0.1, y: 0 };
const GRAD_END    = { x: 0.9, y: 1 };
const SHINE_START = { x: 0,   y: 0 };
const SHINE_END   = { x: 0.65, y: 1 };
const BAR_START   = { x: 0,   y: 0 };
const BAR_END     = { x: 1,   y: 0 };

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { zIndex: 9999 },
  particle: { position: 'absolute' },

  bgOrbTR: {
    position: 'absolute', top: -SW * 0.35, right: -SW * 0.25,
    width: SW * 0.85, height: SW * 0.85, borderRadius: SW * 0.425,
  },
  bgOrbBL: {
    position: 'absolute', bottom: -SW * 0.45, left: -SW * 0.25,
    width: SW * 0.85, height: SW * 0.85, borderRadius: SW * 0.425,
  },
  bgOrbCenter: {
    position: 'absolute',
    top: SH * 0.42, left: SW * 0.5 - SW * 0.45,
    width: SW * 0.9, height: SW * 0.9, borderRadius: SW * 0.45,
  },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 44,
  },

  pulseRing: {
    position: 'absolute',
    width: ORB_SIZE + 42, height: ORB_SIZE + 42,
    borderRadius: (ORB_SIZE + 42) / 2,
    borderWidth: 1.5,
  },
  ring1: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80, borderWidth: 1,
  },
  ring2: {
    position: 'absolute',
    width: 195, height: 195, borderRadius: 97.5, borderWidth: 0.5,
  },

  glowL3: {
    position: 'absolute',
    width: ORB_SIZE + 90, height: ORB_SIZE + 90,
    borderRadius: (ORB_SIZE + 90) / 2,
  },
  glowL2: {
    position: 'absolute',
    width: ORB_SIZE + 56, height: ORB_SIZE + 56,
    borderRadius: (ORB_SIZE + 56) / 2,
  },
  glowL1: {
    position: 'absolute',
    width: ORB_SIZE + 28, height: ORB_SIZE + 28,
    borderRadius: (ORB_SIZE + 28) / 2,
  },

  orbWrap: {
    zIndex: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 28,
    elevation: 28,
  },
  orb: {
    width: ORB_SIZE, height: ORB_SIZE, borderRadius: ORB_RAD,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  orbShine: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: ORB_SIZE * 0.55,
    borderTopLeftRadius: ORB_RAD, borderTopRightRadius: ORB_RAD,
  },
  orbShadow: {
    position: 'absolute', bottom: 0, right: 0,
    width: ORB_SIZE * 0.55, height: ORB_SIZE * 0.55,
    borderRadius: ORB_SIZE * 0.28,
  },
  orbDot: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  orbDotInner: { width: 11, height: 11, borderRadius: 5.5 },

  nameRow: {
    flexDirection: 'row', marginTop: 30, alignItems: 'center',
  },
  nameLetter: {
    fontSize: 34, fontWeight: '800', letterSpacing: 0.2, lineHeight: 44,
  },

  taglineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10,
  },
  taglineDot: { width: 4, height: 4, borderRadius: 2 },
  tagline:    { fontSize: 13, letterSpacing: 0.6, fontWeight: '500' },

  version: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    fontSize: 11, letterSpacing: 1.2, fontWeight: '600',
  },

  progressTrack: {
    position: 'absolute', bottom: 50, left: 40,
    width: PROGRESS_WIDTH, height: 2.5, borderRadius: 2, overflow: 'hidden',
  },
  progressFill:    { height: '100%', borderRadius: 2 },
  progressShimmer: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 14, backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 2,
  },
});
