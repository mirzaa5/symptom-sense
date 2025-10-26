#!/usr/bin/env node

/**
 * Platform detection script
 * Runs the appropriate startup script based on the operating system
 */

const { spawn } = require('child_process');
const platform = process.platform;
const mode = process.argv[2] || 'docker'; // docker or local

let scriptName;

if (mode === 'docker') {
  scriptName = platform === 'win32' ? 'start-docker.bat' : 'start-docker.sh';
} else {
  scriptName = platform === 'win32' ? 'start-local.bat' : 'start-local.sh';
}

console.log(`\n🔍 Detected platform: ${platform}`);
console.log(`📜 Running: ${scriptName}\n`);

// Make script executable on Unix systems
if (platform !== 'win32') {
  const { execSync } = require('child_process');
  try {
    execSync(`chmod +x ./${scriptName}`, { stdio: 'ignore' });
  } catch (err) {
    // Ignore errors if chmod fails
  }
}

// Spawn the appropriate script with proper path
const child = spawn(`./${scriptName}`, [], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error(`\n❌ Error: ${error.message}`);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});

