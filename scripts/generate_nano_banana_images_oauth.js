#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const script = path.join(__dirname, 'generate_nano_banana_images.js');
const args = [script, ...process.argv.slice(2), '--auth', 'oauth'];

const child = spawn(process.execPath, args, { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (typeof code === 'number') process.exit(code);
  process.exit(signal ? 1 : 0);
});
