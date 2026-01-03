#!/usr/bin/env node

/**
 * 修复编译后的 project.config.json 文件中的 libVersion 字段
 * 确保 libVersion 是字符串类型，而不是空字符串
 */

const fs = require('fs');
const path = require('path');

const projectConfigPath = path.join(__dirname, '..', 'dist', 'dev', 'mp-weixin', 'project.config.json');
const sourceConfigPath = path.join(__dirname, '..', 'project.config.json');

function fixProjectConfig() {
  // 读取源配置文件获取 libVersion
  let libVersion = '3.13.0'; // 默认值
  
  if (fs.existsSync(sourceConfigPath)) {
    try {
      const sourceConfig = JSON.parse(fs.readFileSync(sourceConfigPath, 'utf8'));
      if (sourceConfig.libVersion && typeof sourceConfig.libVersion === 'string') {
        libVersion = sourceConfig.libVersion;
      }
    } catch (e) {
      console.warn('无法读取源配置文件，使用默认 libVersion:', e.message);
    }
  }

  // 检查并修复编译后的配置文件
  if (fs.existsSync(projectConfigPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
      
      // 如果 libVersion 是空字符串或不存在，则设置为正确的值
      if (!config.libVersion || config.libVersion === '' || typeof config.libVersion !== 'string') {
        config.libVersion = libVersion;
        fs.writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✅ 已修复 project.config.json 中的 libVersion: ${libVersion}`);
      } else if (config.libVersion !== libVersion) {
        // 如果值不一致，也更新它
        config.libVersion = libVersion;
        fs.writeFileSync(projectConfigPath, JSON.stringify(config, null, 2), 'utf8');
        console.log(`✅ 已更新 project.config.json 中的 libVersion: ${libVersion}`);
      } else {
        console.log(`✓ project.config.json 中的 libVersion 已正确: ${libVersion}`);
      }
    } catch (e) {
      console.error('❌ 修复 project.config.json 失败:', e.message);
      process.exit(1);
    }
  } else {
    console.warn('⚠️  编译输出文件不存在，跳过修复:', projectConfigPath);
  }
}

// 执行修复
fixProjectConfig();

