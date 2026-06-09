# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
