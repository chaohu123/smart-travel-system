#!/usr/bin/env node

/**
 * uni CLI wrapper script
 * 过滤掉 --watch 选项，因为 uni-app CLI 不支持该选项
 */

const { spawn } = require('child_process');
const path = require('path');

// 获取所有参数，过滤掉 --watch
const args = process.argv.slice(2).filter(arg => arg !== '--watch');

// 查找 uni 命令
const uniPath = path.join(__dirname, '..', 'node_modules', '.bin', 'uni');

// 执行 uni 命令
const child = spawn(uniPath, args, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..')
});

child.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

