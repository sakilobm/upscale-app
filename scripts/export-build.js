const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Color helpers
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m"
};

function log(msg, color = colors.reset) {
  console.log(`${color}${msg}${colors.reset}`);
}

// 1. Parse Arguments
const args = process.argv.slice(2);
let targetEnv = null;
let bumpType = 'patch';
let commandToRun = null;
let runTsc = true;
let bumpVersion = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env' && args[i + 1]) {
    targetEnv = args[i + 1];
    i++;
  } else if (args[i] === '--bump' && args[i + 1]) {
    bumpType = args[i + 1];
    if (bumpType === 'none') {
      bumpVersion = false;
    }
    i++;
  } else if (args[i] === '--command' && args[i + 1]) {
    commandToRun = args[i + 1];
    i++;
  } else if (args[i] === '--no-tsc') {
    runTsc = false;
  }
}

// Default target env to production if we are running an export/build
if (!targetEnv) {
  targetEnv = 'production';
}

log(`\n🚀 Starting build & export flow...`, colors.bold + colors.cyan);
log(`Environment:  ${targetEnv.toUpperCase()}`, colors.green);
log(`Bump Type:    ${bumpType}`, colors.green);

const versionPath = path.resolve(__dirname, '../version.json');
let versionInfo = { version: "1.0.0", versionCode: 1 };

if (fs.existsSync(versionPath)) {
  versionInfo = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
} else {
  log(`⚠️  version.json not found, initializing.`, colors.yellow);
}

const oldVersion = versionInfo.version;
const oldVersionCode = versionInfo.versionCode;

if (bumpVersion) {
  // Bump version code
  versionInfo.versionCode = (versionInfo.versionCode || 0) + 1;

  // Bump version string (semver patch, minor, major)
  const parts = versionInfo.version.split('.').map(Number);
  if (parts.length === 3 && !parts.some(isNaN)) {
    if (bumpType === 'major') {
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
    } else if (bumpType === 'minor') {
      parts[1] += 1;
      parts[2] = 0;
    } else {
      // default: patch
      parts[2] += 1;
    }
    versionInfo.version = parts.join('.');
  } else {
    log(`⚠️  Could not parse semver from "${versionInfo.version}". Keeping version as is.`, colors.yellow);
  }

  // Write new version file
  fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2), 'utf8');
  log(`✅ Version Bumped:`, colors.green);
  log(`   Version:     ${oldVersion} ➡️  ${versionInfo.version}`, colors.bold + colors.green);
  log(`   VersionCode: ${oldVersionCode} ➡️  ${versionInfo.versionCode}`, colors.bold + colors.green);
} else {
  log(`ℹ️  Skipping version bump (version: ${oldVersion}, versionCode: ${oldVersionCode})`, colors.yellow);
}

// 2. TypeScript compilation validation check
if (runTsc) {
  log(`\n🔍 Running TypeScript Compilation Check...`, colors.cyan);
  const tscResult = spawnSync('npx', ['tsc', '--noEmit'], { shell: true, stdio: 'inherit' });
  if (tscResult.status !== 0) {
    log(`❌ TypeScript validation failed. Fix compiling errors before building/exporting.`, colors.red);
    process.exit(1);
  }
  log(`✅ TypeScript compilation check passed successfully!`, colors.green);
}

// 3. Clean export outputs (if command is export)
if (commandToRun && commandToRun.includes('expo export')) {
  log(`\n🧹 Cleaning previous dist folder...`, colors.cyan);
  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log(`✅ Cleaned dist/ directory`, colors.green);
  }
}

// 4. Run the actual command
if (commandToRun && commandToRun !== 'none') {
  log(`\n🏃 Executing Build Command: "${commandToRun}"`, colors.bold + colors.cyan);

  // Set environment variables for the subprocess
  const buildEnv = {
    ...process.env,
    APP_ENV: targetEnv,
    EAS_BUILD_PROFILE: targetEnv === 'production' ? 'production' : 'development'
  };

  const runResult = spawnSync(commandToRun, {
    shell: true,
    stdio: 'inherit',
    env: buildEnv
  });

  if (runResult.status !== 0) {
    log(`❌ Command execution failed with code ${runResult.status}`, colors.red);
    process.exit(runResult.status || 1);
  }
  log(`🎉 Export/Build Command completed successfully!`, colors.bold + colors.green);
} else {
  log(`\n💡 No command specified. To run a command, use: --command "npx expo export"`, colors.yellow);
}
