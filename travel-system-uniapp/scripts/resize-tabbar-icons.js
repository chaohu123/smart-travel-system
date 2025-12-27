const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 配置
const ICON_DIR = path.join(__dirname, '../src/static/tabbar');
const TARGET_SIZE = 81; // 目标尺寸 81x81px
const BACKUP_DIR = path.join(__dirname, '../src/static/tabbar/backup');

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 读取所有 PNG 文件
const files = fs.readdirSync(ICON_DIR).filter(file =>
  file.endsWith('.png') && !file.startsWith('backup')
);

console.log(`找到 ${files.length} 个图标文件需要处理...\n`);

// 处理每个文件
async function processIcons() {
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const inputPath = path.join(ICON_DIR, file);
    const backupPath = path.join(BACKUP_DIR, file);
    const outputPath = path.join(ICON_DIR, file);

    try {
      // 1. 备份原文件
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(inputPath, backupPath);
        console.log(`✓ 已备份: ${file}`);
      }

      // 2. 获取原图信息
      const metadata = await sharp(inputPath).metadata();
      console.log(`\n处理: ${file}`);
      console.log(`  原始尺寸: ${metadata.width}x${metadata.height}`);

      // 3. 调整图片尺寸（使用临时文件）
      const tempPath = path.join(ICON_DIR, `temp_${file}`);
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: 'contain', // 保持比例，内容完整显示
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
        })
        .extend({
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({
          quality: 100,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toFile(tempPath);

      // 4. 替换原文件
      fs.renameSync(tempPath, outputPath);

      // 5. 验证结果
      const newMetadata = await sharp(outputPath).metadata();
      console.log(`  新尺寸: ${newMetadata.width}x${newMetadata.height}`);
      console.log(`  文件大小: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
      console.log(`  ✓ 处理成功: ${file}\n`);

      successCount++;
    } catch (error) {
      console.error(`  ✗ 处理失败: ${file}`);
      console.error(`  错误: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`处理完成！`);
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${errorCount} 个`);
  console.log(`备份目录: ${BACKUP_DIR}`);
  console.log('='.repeat(50));
}

// 运行处理
processIcons().catch(error => {
  console.error('脚本执行出错:', error);
  process.exit(1);
});

