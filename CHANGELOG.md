# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
