# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.2] - 2026-06-13

### Changed
- Increased the gap between elements in the fixed top area (Top Card, Searchbar, Accounts Bar, and Filter Bar) to `Spacing['4']` (16px) in `src/app/(tabs)/transactions.tsx`.
- Removed `marginBottom: Spacing['3']` from `src/features/transactions/components/FilterBar.tsx` and reduced `listContent`'s `paddingTop` to `Spacing['2']` (8px) in `src/app/(tabs)/transactions.tsx` to pull the transactions list up and reduce extra bottom space.

### Architectural Decisions
- **Standardized Grid Alignment**: Swapped asymmetric/cramped spacing (12px) for standard 16px grid intervals (`Spacing['4']`) inside the fixed header, aligning it with premium mobile spacing guides.
- **De-duplicating Stack Spacing**: Eliminated overlapping vertical padding/margins between separate component hierarchies (`FilterBar` internal margins, `topArea` gap, and list container offset padding) to keep list view layouts predictable.

### Rollback & Escape Plan
- **Forward-fix path**: If spacing constraints shift on smaller device types (like iPhone SE), adjust layout gap in `src/app/(tabs)/transactions.tsx`.
- **Rollback path**: Run `git checkout src/app/(tabs)/transactions.tsx src/features/transactions/components/FilterBar.tsx`.

## [1.4.1] - 2026-06-13

### Fixed
- Fixed vertical alignment of placeholder text and entered text inside the transactions search `TextInput` in `src/app/(tabs)/transactions.tsx`.

### Architectural Decisions
- **Removing Line Height Conflicts**: Overrode `lineHeight` inheritance to `undefined` for `TextInput` component text layouts to prevent platform-specific baseline offset issues on iOS/Android.
- **Dynamic Flex Height Alignment**: Replaced parent-matching duplicate hardcoded height constraints with `paddingVertical: 0` to let the search input expand inside its flexbox container naturally.

### Rollback & Escape Plan
- **Forward-fix path**: If text sizing issues surface, re-verify line-height values or text wrapping rules on older Android SDK versions.
- **Rollback path**: Run `git checkout src/app/(tabs)/transactions.tsx` to restore previous style configurations.

## [1.4.0] - 2026-06-13

### Changed
- Renamed the application name from `MoneyApp` to `WhereCash`.
- Synchronized configuration keys across `app.json`, `package.json`, and `package-lock.json` (`name`, `slug`, `scheme`, `bundleIdentifier`, and `package` fields).
- Updated user-facing brand strings, support email contact domain (`support@wherecash.app`), and sharing headers inside the Profile setting page (`src/app/(tabs)/profile.tsx`).
- Regenerated native project wrappers for Android (`android/`) and iOS using `npx expo prebuild`.

### Architectural Decisions
- **Unified Branding Namespace**: Renamed native identifiers (`com.wherecash.app`, custom scheme `wherecash://`) to ensure consistent deep linking, native package lookup, and store listing identities under the new brand.
- **Expo Prebuild Generation**: Utilized the automated Expo Prebuild tool chain to safely sync the Javascript workspace properties into Android native XML, Kotlin, and Gradle setups, preventing manually-induced build mismatches.

### Rollback & Escape Plan
- **Forward-fix path**: If native folders experience configuration caching or package search failures, run `npx expo prebuild --clean` or clear build cache using `cd android; ./gradlew clean`.
- **Rollback path**: Run `git checkout app.json package.json package-lock.json src/app/(tabs)/profile.tsx ARCHITECTURE_DOCUMENTATION.md` and run `npx expo prebuild --clean` to restore original namespaces.

## [1.3.2] - 2026-06-12

### Fixed
- Fixed missing React Native imports (`Modal`, `TextInput`, `Platform`) and safe area hook (`useSafeAreaInsets`) in `src/app/categories.tsx` to resolve TypeScript compilation errors (`Cannot find name`).
- Resolved release bundler failure in `:app:createBundleReleaseJsAndAssets` by exporting static assets and bundling via Metro clean task, successfully compiling the production APK.

### Architectural Decisions
- **Standard Dependency Alignment**: Resolved syntax errors using standard, non-invasive imports from peer dependencies `react-native` and `react-native-safe-area-context` to maintain compatibility with existing navigation and custom layouts.

### Rollback & Escape Plan
- **Forward-fix path**: If React Native or Expo versions change in the future and cause import conflicts, review the peer dependency specifications in `package.json` or run `npx expo install` to ensure library compatibility.
- **Rollback path**: Run `git checkout src/app/categories.tsx` to undo the added imports. No state or database configurations are impacted.

## [1.3.1] - 2026-06-12

### Added
- Replaced the category emojis inside the center of the `ProgressRing` budget circles with polished, modern vector `Ionicons` icons.
- Engineered a circular liquid-glassmorphic center badge in `src/components/ProgressRing.tsx` that renders the category vector icon over a blurred/translucent glass background, micro borders, and subtle drop shadows.
- Integrated category icon mapping by reading directly from `CATEGORY_META` inside `src/features/budget/components/ProgressRingMatrix.tsx`.

### Architectural Decisions
- **Unified Vector Visuals**: Phased out all raw emojis inside progress circles in favor of high-fidelity vector outline icons to maintain fintech professionalism and high-end aesthetics.
- **Glassmorphic Badge Refraction**: Chose a semi-translucent backdrop (`rgba(255, 255, 255, 0.70)`) with drop shadow overlays in the center of SVG rings to preserve design continuity.

### Rollback & Escape Plan
- **Forward-fix path**: Tweak the layout percentage bounds (`size * 0.32`) or padding in `src/components/ProgressRing.tsx` if the center badge overflows the text label on smaller device screen sizes.
- **Rollback path**: Run `git checkout src/components/ProgressRing.tsx src/features/budget/components/ProgressRingMatrix.tsx` to restore original emoji labels inside the budget overview rings. No database operations are affected.

## [1.3.0] - 2026-06-12

### Added
- Integrated a dynamic status icon badge (using `Ionicons`) in the Monthly Overview header of the Budget screen (`src/app/(tabs)/budget.tsx`) that changes state dynamically based on user spending (e.g. standard `wallet` for healthy, yellow `trending-up` for caution, red `alert-circle` for over-budget).
- Added a soft, looping pulse micro-animation (using Reanimated `withRepeat` and `withSequence`) to the caution icon when a user is over budget.
- Added smooth, staggered screen-entrance animations (`FadeInDown.springify()`) for the overview card, the progress rings matrix, and the planned payments timeline on the Budget screen.
- Upgraded the static budget overview progress bar to a native spring-animated progress bar powered by `react-native-reanimated` shared values.
- Polished the layout of the Overview card, incorporating dynamic border glows (red/yellow/indigo), secondary metrics like total remaining budget, and an alert footer for exceeded category budgets.

### Fixed
- Fixed compilation error `TS2339` in `src/app/(tabs)/ledger.tsx` by adding the missing `debtStack` stylesheet definition.

### Architectural Decisions
- **Native-Driven Shared-Value Springs**: Opted for Reanimated worklets and `useSharedValue` to drive the overview progress bar and icon scaling. This offloads visual frame updates from the React Native JavaScript thread to the main UI thread, ensuring smooth 60 FPS transitions.
- **Dynamic State Visual Cues**: Engineered the visual indicators (badges, border glow, gradients) to adapt to utilization states (normal, warning at 85%, over-budget at 100%) for instant user recognition of spending health.

### Rollback & Escape Plan
- **Forward-fix path**: Adjust spring animation parameters (`damping`, `stiffness`) or layout delay intervals in `src/app/(tabs)/budget.tsx` if render performance or layout stuttering is observed on low-end target devices.
- **Rollback path**: Run `git checkout src/app/(tabs)/budget.tsx src/app/(tabs)/ledger.tsx` to restore previous static layouts and icons. No database migrations or persistent storage changes were introduced.

## [1.2.0] - 2026-06-09

### Added
- Upgraded `src/components/GlassCard.tsx` to implement liquid glassmorphism, supporting active frosted `BlurView` overlays on both light and dark modes, double-layered drop shadows, and horizontal top reflection shine bars.
- Replaced emoji-based category indicators in `src/components/CategoryIcon.tsx` with professional `Ionicons` vector icons (e.g. `home-outline`, `car-outline`, `medical-outline`, `laptop-outline`, `game-controller-outline`) framed in custom glassmorphic bordered square badges.
- Redesigned `BalanceCard.tsx` balance indicators (both light and dark modes) as high-end frosted glass sheets with glowing background orbs that refract light through a frosted layer.

### Architectural Decisions
- **Unified Glass Blur**: Chose to run `BlurView` in both light mode (frosted white `tint="light"`) and dark mode (frosted black `tint="dark"`). This ensures consistent luxury visual feedback on iOS, and uses matching translucent gradient backgrounds on Android.
- **Professional Iconography**: Decided to phase out emojis in favor of vector outline icons to establish a polished, professional fintech design aesthetic.

### Rollback & Escape Plan
- **Forward-fix path**: If text contrast or icon visibility is weak under specific lighting conditions or theme mode transitions, modify the opacity parameters in `GlassCard.tsx` or adjust border opacity settings in `CategoryIcon.tsx`.
- **Rollback path**: Run `git checkout src/components/CategoryIcon.tsx src/components/GlassCard.tsx src/features/dashboard/components/BalanceCard.tsx` to revert the visual redesign.

## [1.1.0] - 2026-06-09

### Added
- Created a high-performance floating custom bottom tab bar (`src/components/CustomTabBar.tsx`) with an animated indicator pill, spring-based icon scaling, text-fade transitions, and Haptic feedback integrations.
- Integrated `expo-haptics` for tactile selection responses during tab transitions.
- Added automated TypeScript and validation compiler checking script `testing/run_all_test_scripts.sh`.
- Added high-level architecture diagrams (`ARCHITECTURE_DIAGRAM.mmd` and `ARCHITECTURE_DOCUMENTATION.md`) to document system dependencies.

### Changed
- Replaced default layout routing configurations in `src/app/(tabs)/_layout.tsx` to mount the custom bottom navigation component.
- Exported the newly created `CustomTabBar` in the components registry entry file (`src/components/index.ts`).

### Architectural Decisions
- **Custom Local Interfaces**: Chose to define simplified type declarations locally in `CustomTabBar.tsx` rather than forcing root dependency on transitive package `@react-navigation/bottom-tabs`. This keeps the build stable, prevents module resolution discrepancies, and isolates React Router behaviors.
- **Worklet-Driven Animations**: Chose `react-native-reanimated` spring physics over standard Javascript-thread `Animated` components to deliver premium micro-animations that run seamlessly at 60 FPS.

### Rollback & Escape Plan
- **Forward-fix path**: Adjust `bottomPosition` or container layout parameters in `src/components/CustomTabBar.tsx` if inset height conflicts on specific mobile devices. If layout animations experience issues, reset cache using `npx expo start --clear` or verify Reanimated configuration in `babel.config.js`.
- **Rollback path**: Run `git checkout src/app/(tabs)/_layout.tsx src/components/index.ts` to restore standard navigation layouts, and delete the custom components `src/components/CustomTabBar.tsx`, script `testing/run_all_test_scripts.sh`, and documentation files `ARCHITECTURE_DOCUMENTATION.md` and `ARCHITECTURE_DIAGRAM.mmd`. No database migrations are affected.

## [1.0.1] - 2026-06-09

### Added
- Configured adaptive icon background image (`./assets/android-icon-background.png`) and monochrome image (`./assets/android-icon-monochrome.png`) in `app.json`.
- Installed `react-native-worklets@0.9.1` with `--legacy-peer-deps` to satisfy `react-native-reanimated@4.4.1` peer requirements, bypassing `expo-modules-core`'s optional older peer requirement.
- Installed `babel-preset-expo` as a development dependency to resolve missing Babel preset required by `babel.config.js`.

### Fixed
- Fixed unresolved adaptive icon foreground asset path in `app.json` (changed from non-existent `./assets/adaptive-icon.png` to `./assets/android-icon-foreground.png`).
- Resolved Metro Bundler initialization failure (`TypeError: Cannot read properties of undefined (reading 'transformFile')`) caused by the invalid asset path rejecting the DependencyGraph loading promise.

### Rollback & Escape Plan
- **Forward-fix path**: If any further asset or module issues occur, verify files in `./assets` match configuration keys in `app.json`, and verify package peer dependencies match.
- **Rollback path**: Revert `app.json` changes to previous paths using `git checkout app.json`, and uninstall packages using `npm uninstall react-native-worklets babel-preset-expo`. No database changes are associated with this change.
