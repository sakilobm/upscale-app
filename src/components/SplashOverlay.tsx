import { useEffect, useRef, useState } from 'react';
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
import { DarkTheme, LightTheme } from '@constants/themes';

// ─── Layout & timing ──────────────────────────────────────────────────────────

const { width: SW, height: SH } = Dimensions.get('window');

const ORB_SIZE       = 92;
const ORB_RAD        = 28;
const PROGRESS_W     = SW - 80;
const LETTER_STAGGER = 52;   // ms between each letter drop
const LETTER_DELAY   = 500;  // ms before first letter appears
const ANIM_TOTAL_MS  = 2150; // total visible animation time
const EXIT_MS        = 440;  // fade-out duration

const APP_LETTERS = 'WhereCash'.split('');

// ─── Orb gradient tuning ──────────────────────────────────────────────────────
// These two stops are visual-tuning values specific to the splash orb shape;
// they are NOT semantic app colors and intentionally live outside the theme.

const ORB_TINT  = '#9D95FF'; // lighter purple highlight (top-left)
const ORB_SHADE = '#4540CC'; // deeper indigo shadow    (bottom-right)

// ─── Alpha tokens (suffix appended to a base hex color) ──────────────────────

const A = {
  PARTICLE_A:   'CC',
  PARTICLE_B:   'BB',
  PARTICLE_C:   '88',
  PARTICLE_D:   '99',
  PARTICLE_E:   '77',
  PARTICLE_F:   '55',
  BG_TR:        '18',
  BG_BL:        '18',
  BG_CTR:       '0A',
  PULSE_DARK:   '80',
  PULSE_LIGHT:  '60',
  RING_1:       '28',
  RING_2:       '18',
  GLOW_L3:      '08',
  GLOW_L2:      '12',
  GLOW_L1:      '1A',
  VERSION_DARK: '60',
  VERSION_LT:   '90',
  TAGLINE_DOT:  '90',
} as const;

// Glass-shine values (always white — no theme token needed)
const GLASS_SHINE_DARK  = 'rgba(255,255,255,0.38)' as const;
const GLASS_SHINE_LIGHT = 'rgba(255,255,255,0.55)' as const;
const GLASS_CLEAR       = 'rgba(255,255,255,0.00)' as const;
const GLASS_SHIMMER     = 'rgba(255,255,255,0.65)' as const;
const ICON_WHITE        = '#FFFFFF'; // icon is always white regardless of mode

// ─── Palette interface ────────────────────────────────────────────────────────

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

// ─── Palette factories (pull from existing theme constants) ───────────────────

function buildDarkPalette(): Palette {
  const { background, brand, text, glass, shadow, white } = DarkTheme;
  return {
    bg:          background.primary,
    bgGrad:      [background.primary, background.secondary, background.tertiary],
    orbGrad:     [ORB_TINT, brand.primary, ORB_SHADE],
    orbShine:    [GLASS_SHINE_DARK, GLASS_CLEAR],
    brand:       brand.primary,
    accent:      brand.accent,
    nameLetter:  white,
    tagline:     text.tertiary,
    version:     text.tertiary + A.VERSION_DARK,
    progressBg:  glass.background,
    orbShadow:   shadow.darkLight,
    orbDotBg:    background.primary,
    bgOrbTR:     brand.primary + A.BG_TR,
    bgOrbBL:     brand.accent  + A.BG_BL,
    bgOrbCenter: brand.primary + A.BG_CTR,
    pulseRing:   brand.primary + A.PULSE_DARK,
    ring1:       brand.primary + A.RING_1,
    ring2:       brand.accent  + A.RING_2,
    glowL3:      brand.primary + A.GLOW_L3,
    glowL2:      brand.primary + A.GLOW_L2,
    glowL1:      brand.primary + A.GLOW_L1,
  };
}

function buildLightPalette(): Palette {
  const { background, brand, text, glass, shadow } = LightTheme;
  // Light theme uses brand.accent (#6C63FF) as the purple for the splash orb,
  // and borrows DarkTheme.brand.accent (#38BDF8) for the sky-blue highlights
  // since LightTheme has no sky-blue token.
  const splashBrand  = brand.accent;           // '#6C63FF' purple accent
  const splashAccent = DarkTheme.brand.accent;  // '#38BDF8' sky blue
  return {
    bg:          background.primary,
    bgGrad:      [background.tertiary, background.primary, background.secondary],
    orbGrad:     [ORB_TINT, splashBrand, ORB_SHADE],
    orbShine:    [GLASS_SHINE_LIGHT, GLASS_CLEAR],
    brand:       splashBrand,
    accent:      splashAccent,
    nameLetter:  text.primary,
    tagline:     text.tertiary,
    version:     text.tertiary + A.VERSION_LT,
    progressBg:  glass.backgroundMid,
    orbShadow:   shadow.darkMid,
    orbDotBg:    background.primary,
    bgOrbTR:     splashBrand  + A.BG_TR,
    bgOrbBL:     splashAccent + A.BG_BL,
    bgOrbCenter: splashBrand  + A.BG_CTR,
    pulseRing:   splashBrand  + A.PULSE_LIGHT,
    ring1:       splashBrand  + A.RING_1,
    ring2:       splashAccent + A.RING_2,
    glowL3:      splashBrand  + A.GLOW_L3,
    glowL2:      splashBrand  + A.GLOW_L2,
    glowL1:      splashBrand  + A.GLOW_L1,
  };
}

// Build once at module load — no runtime allocation on every render
const DARK_PALETTE  = buildDarkPalette();
const LIGHT_PALETTE = buildLightPalette();

// ─── Particle config ──────────────────────────────────────────────────────────

interface ParticleConfig {
  ox: number; oy: number; delay: number; size: number; color: string;
}

function buildParticles(brand: string, accent: string, brandSoft: string): ParticleConfig[] {
  return [
    { ox: -90,  oy: 170, delay: 280, size: 5, color: brand     + A.PARTICLE_A },
    { ox:  55,  oy: 200, delay: 460, size: 4, color: accent    + A.PARTICLE_B },
    { ox: -25,  oy: 145, delay: 160, size: 6, color: brand     + A.PARTICLE_C },
    { ox:  115, oy: 185, delay: 390, size: 3, color: brandSoft + A.PARTICLE_D },
    { ox: -115, oy: 125, delay: 265, size: 4, color: accent    + A.PARTICLE_E },
    { ox:  35,  oy: 160, delay: 580, size: 3, color: brand     + A.PARTICLE_F },
  ];
}

// Both modes use DarkTheme.brand.secondary (#A78BFA) as the soft particle tint
// because both splash variants use the purple orb identity.
const DARK_PARTICLES  = buildParticles(
  DarkTheme.brand.primary,
  DarkTheme.brand.accent,
  DarkTheme.brand.secondary,
);
const LIGHT_PARTICLES = buildParticles(
  LightTheme.brand.accent,
  DarkTheme.brand.accent,
  DarkTheme.brand.secondary,
);

// ─── Animation hook ───────────────────────────────────────────────────────────

function useSplashAnimation(readyToDismiss: boolean, onDismissRef: React.RefObject<() => void>) {
  const ringS  = useSharedValue(0.55);
  const ringOp = useSharedValue(0);
  const orbSc  = useSharedValue(0);
  const orbOp  = useSharedValue(0);
  const subOp  = useSharedValue(0);
  const subY   = useSharedValue(10);
  const barW   = useSharedValue(0);
  const exitOp = useSharedValue(1);
  const exitSc = useSharedValue(1);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    ringOp.value = withDelay(120, withTiming(1, { duration: 350 }));
    ringS.value  = withDelay(120, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));

    orbOp.value = withDelay(220, withTiming(1, { duration: 300 }));
    orbSc.value = withDelay(220, withSpring(1, { damping: 11, stiffness: 170 }));

    subOp.value = withDelay(950, withTiming(1, { duration: 450 }));
    subY.value  = withDelay(950, withSpring(0,  { damping: 18, stiffness: 200 }));

    barW.value = withDelay(320, withTiming(1, { duration: 1550, easing: Easing.inOut(Easing.quad) }));

    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, ANIM_TOTAL_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (minTimeElapsed && readyToDismiss) {
      exitOp.value = withTiming(0,    { duration: EXIT_MS, easing: Easing.in(Easing.cubic) });
      exitSc.value = withTiming(1.08, { duration: EXIT_MS });

      const dismissTimer = setTimeout(() => {
        onDismissRef.current?.();
      }, EXIT_MS);

      return () => clearTimeout(dismissTimer);
    }
  }, [minTimeElapsed, readyToDismiss]);

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
    width: barW.value * PROGRESS_W,
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

// ─── Pre-built node arrays (computed at module load — no per-render allocation) ─

function buildLetterNodes(palette: Palette) {
  return APP_LETTERS.map((char, i) => (
    <NameLetter
      key={i}
      char={char}
      delay={LETTER_DELAY + i * LETTER_STAGGER}
      color={palette.nameLetter}
    />
  ));
}

function buildParticleNodes(configs: ParticleConfig[]) {
  return configs.map((p, i) => <Particle key={i} {...p} />);
}

const DARK_LETTER_NODES   = buildLetterNodes(DARK_PALETTE);
const LIGHT_LETTER_NODES  = buildLetterNodes(LIGHT_PALETTE);
const DARK_PARTICLE_NODES = buildParticleNodes(DARK_PARTICLES);
const LIGHT_PARTICLE_NODES= buildParticleNodes(LIGHT_PARTICLES);

// ─── Gradient point constants ─────────────────────────────────────────────────

const GRAD_ORB_START  = { x: 0.1,  y: 0 };
const GRAD_ORB_END    = { x: 0.9,  y: 1 };
const GRAD_SHINE_START = { x: 0,   y: 0 };
const GRAD_SHINE_END   = { x: 0.65,y: 1 };
const GRAD_BAR_START   = { x: 0,   y: 0 };
const GRAD_BAR_END     = { x: 1,   y: 0 };
const BG_GRAD_LOCATIONS: [number, number, number] = [0, 0.55, 1];

// Progress bar mid-stop uses DarkTheme brand secondary (works on both modes)
const BAR_MID = DarkTheme.brand.secondary; // '#A78BFA'

// ─── SplashOverlay ────────────────────────────────────────────────────────────

export interface SplashOverlayProps {
  isDark?:   boolean;
  readyToDismiss?: boolean;
  onDismiss: () => void;
}

export function SplashOverlay({ isDark = false, readyToDismiss = true, onDismiss }: SplashOverlayProps) {
  const T = isDark ? DARK_PALETTE : LIGHT_PALETTE;

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const { ringStyle, orbStyle, subStyle, barStyle, rootStyle } =
    useSplashAnimation(readyToDismiss, onDismissRef);

  const letterNodes   = isDark ? DARK_LETTER_NODES   : LIGHT_LETTER_NODES;
  const particleNodes = isDark ? DARK_PARTICLE_NODES : LIGHT_PARTICLE_NODES;
  const barColors     = [T.brand, BAR_MID, T.accent] as const;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, { backgroundColor: T.bg }, rootStyle]}>

      {/* Background gradient */}
      <LinearGradient colors={T.bgGrad} locations={BG_GRAD_LOCATIONS} style={StyleSheet.absoluteFill} />

      {/* Atmospheric glow orbs */}
      <View style={[styles.bgOrbTR,     { backgroundColor: T.bgOrbTR     }]} />
      <View style={[styles.bgOrbBL,     { backgroundColor: T.bgOrbBL     }]} />
      <View style={[styles.bgOrbCenter, { backgroundColor: T.bgOrbCenter }]} />

      {/* Floating particles */}
      {particleNodes}

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
          <LinearGradient colors={T.orbGrad} start={GRAD_ORB_START} end={GRAD_ORB_END} style={styles.orb}>
            <LinearGradient colors={T.orbShine} start={GRAD_SHINE_START} end={GRAD_SHINE_END} style={styles.orbShine} />
            <View style={[styles.orbShadow, { backgroundColor: T.orbShadow }]} />
            <Ionicons name="wallet" size={42} color={ICON_WHITE} />
          </LinearGradient>
          <View style={[styles.orbDot, { backgroundColor: T.orbDotBg }]}>
            <View style={[styles.orbDotInner, { backgroundColor: T.accent }]} />
          </View>
        </Animated.View>

        {/* Letter-by-letter name */}
        <View style={styles.nameRow}>
          {letterNodes}
        </View>

        {/* Tagline */}
        <Animated.View style={[styles.taglineRow, subStyle]}>
          <View style={[styles.taglineDot, { backgroundColor: T.brand + A.TAGLINE_DOT }]} />
          <Animated.Text style={[styles.tagline, { color: T.tagline }]}>
            Track smarter · Spend wiser
          </Animated.Text>
          <View style={[styles.taglineDot, { backgroundColor: T.brand + A.TAGLINE_DOT }]} />
        </Animated.View>
      </View>

      {/* Version label */}
      <Animated.Text style={[styles.version, { color: T.version }, subStyle]}>
        v1.0
      </Animated.Text>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: T.progressBg }]}>
        <Animated.View style={[styles.progressFill, barStyle]}>
          <LinearGradient colors={barColors} start={GRAD_BAR_START} end={GRAD_BAR_END} style={StyleSheet.absoluteFill} />
          <View style={styles.progressShimmer} />
        </Animated.View>
      </View>

    </Animated.View>
  );
}

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
    width:  ORB_SIZE + 42, height: ORB_SIZE + 42,
    borderRadius: (ORB_SIZE + 42) / 2, borderWidth: 1.5,
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
    width: ORB_SIZE + 90, height: ORB_SIZE + 90, borderRadius: (ORB_SIZE + 90) / 2,
  },
  glowL2: {
    position: 'absolute',
    width: ORB_SIZE + 56, height: ORB_SIZE + 56, borderRadius: (ORB_SIZE + 56) / 2,
  },
  glowL1: {
    position: 'absolute',
    width: ORB_SIZE + 28, height: ORB_SIZE + 28, borderRadius: (ORB_SIZE + 28) / 2,
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
    width: ORB_SIZE * 0.55, height: ORB_SIZE * 0.55, borderRadius: ORB_SIZE * 0.28,
  },
  orbDot: {
    position: 'absolute', top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  orbDotInner: { width: 11, height: 11, borderRadius: 5.5 },

  nameRow: { flexDirection: 'row', marginTop: 30, alignItems: 'center' },
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
    width: PROGRESS_W, height: 2.5, borderRadius: 2, overflow: 'hidden',
  },
  progressFill:    { height: '100%', borderRadius: 2 },
  progressShimmer: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 14, backgroundColor: GLASS_SHIMMER, borderRadius: 2,
  },
});
