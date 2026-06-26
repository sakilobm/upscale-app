const path = require('path');
const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSigning(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = addSigningConfig(config.modResults.contents);
    }
    return config;
  });
};

function addSigningConfig(buildGradle) {
  const keystorePath = process.env.RELEASE_KEYSTORE_PATH;
  const keystorePassword = process.env.RELEASE_KEYSTORE_PASSWORD;
  const keyAlias = process.env.RELEASE_KEY_ALIAS;
  const keyPassword = process.env.RELEASE_KEY_PASSWORD;

  if (!keystorePath || !keystorePassword || !keyAlias || !keyPassword) {
    console.warn('[withAndroidSigning] Warning: Missing release signing env variables. Skipping build.gradle release signing config.');
    return buildGradle;
  }

  // Resolve keystore path relative to android/app/ where gradle executes
  let gradleKeystorePath = keystorePath;
  if (!path.isAbsolute(keystorePath) && !keystorePath.startsWith('..')) {
    gradleKeystorePath = `../../${keystorePath}`;
  }

  const releaseSigningBlock = `
        release {
            storeFile file("${gradleKeystorePath.replace(/\\/g, '/')}")
            storePassword "${keystorePassword}"
            keyAlias "${keyAlias}"
            keyPassword "${keyPassword}"
        }`;

  // 1. Inject release signing configuration inside signingConfigs
  if (buildGradle.includes('signingConfigs {') && !/signingConfigs\s*\{\s*release\s*\{/.test(buildGradle) && buildGradle.includes('debug {')) {
    buildGradle = buildGradle.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {${releaseSigningBlock}`
    );
    console.log('[withAndroidSigning] Successfully injected signingConfigs.release');
  }

  // 2. Change release buildTypes to use release signing config
  const releaseBuildTypeRegex = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?signingConfig\s+signingConfigs\.)debug/;
  if (releaseBuildTypeRegex.test(buildGradle)) {
    buildGradle = buildGradle.replace(releaseBuildTypeRegex, '$1release');
    console.log('[withAndroidSigning] Successfully updated buildTypes.release to use signingConfigs.release');
  } else if (buildGradle.includes('release {') && !buildGradle.includes('signingConfig signingConfigs.release')) {
    buildGradle = buildGradle.replace(
      /release\s*\{/,
      `release {\n            signingConfig signingConfigs.release`
    );
    console.log('[withAndroidSigning] Injected signingConfig into buildTypes.release');
  }

  return buildGradle;
}
