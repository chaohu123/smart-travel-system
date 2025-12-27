# TabBar 图标统一规范

## 图标尺寸要求

为了确保 tabbar 图标显示统一，所有图标需要遵循以下规范：

### 推荐尺寸
- **图标尺寸**: 81px × 81px (推荐，适配 @2x 屏幕)
- **图标尺寸**: 40px × 40px (可选，适配 @1x 屏幕)
- **格式**: PNG（支持透明背景）
- **图标内容区域**: 建议图标内容在 60px × 60px 范围内，四周留 10px 边距

### 当前图标文件
所有 tabbar 图标位于 `src/static/tabbar/` 目录：

#### 普通状态图标（未选中）
- `home.png` - 首页图标
- `route.png` - 线路图标
- `checkin.png` - 打卡图标
- `note.png` - 游记图标
- `profile.png` - 我的图标

#### 选中状态图标（激活）
- `home-active.png` - 首页选中图标
- `route-active.png` - 线路选中图标
- `checkin-active.png` - 打卡选中图标
- `note-active.png` - 游记选中图标
- `profile-active.png` - 我的选中图标

## 统一图标的方法

### 方法一：使用图片编辑工具（推荐）

1. **使用 Photoshop / Figma / 在线工具**：
   - 打开所有图标文件
   - 统一调整为 81px × 81px
   - 确保图标内容居中
   - 保持透明背景
   - 导出为 PNG 格式

2. **使用在线工具**：
   - [TinyPNG](https://tinypng.com/) - 压缩和调整大小
   - [Remove.bg](https://www.remove.bg/) - 处理透明背景
   - [Canva](https://www.canva.com/) - 统一尺寸

### 方法二：使用命令行工具（批量处理）

如果安装了 ImageMagick，可以使用以下命令批量调整：

```bash
# 进入图标目录
cd src/static/tabbar

# 批量调整所有图标为 81x81
magick mogrify -resize 81x81 -background transparent -gravity center -extent 81x81 *.png
```

### 方法三：使用 Node.js 脚本（自动化）

可以创建一个 Node.js 脚本来批量处理图标：

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = './src/static/tabbar';
const targetSize = 81;

fs.readdir(iconDir, (err, files) => {
  files.forEach(file => {
    if (file.endsWith('.png')) {
      sharp(path.join(iconDir, file))
        .resize(targetSize, targetSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile(path.join(iconDir, `resized_${file}`))
        .then(() => console.log(`处理完成: ${file}`));
    }
  });
});
```

## 配置说明

在 `pages.json` 中的 tabBar 配置：

### 标准配置（所有平台支持）
```json
"tabBar": {
  "color": "#999999",              // 未选中文字颜色
  "selectedColor": "#3BA272",      // 选中文字颜色
  "backgroundColor": "#FFFFFF",     // tabbar 背景色
  "borderStyle": "black"            // 边框样式
}
```

### 扩展配置（部分平台支持）
以下属性在某些平台（如 H5）可能支持，但在小程序平台可能无效：
```json
"height": "50px",        // tabbar 高度（H5 可能支持）
"fontSize": "10px",       // 文字大小（H5 可能支持）
"iconWidth": "25px",      // 图标宽度（H5 可能支持）
"spacing": "3px"          // 图标和文字间距（H5 可能支持）
```

**重要提示**:
- 图标大小主要依赖**图片本身的尺寸**，而不是配置属性
- 要确保图标统一显示，**必须统一所有 PNG 图片的尺寸**
- 推荐使用 **81px × 81px** 作为标准尺寸

## 检查清单

- [ ] 所有图标尺寸统一为 81px × 81px
- [ ] 所有图标格式为 PNG
- [ ] 图标内容居中显示
- [ ] 透明背景处理正确
- [ ] 普通状态和选中状态图标尺寸一致
- [ ] 图标文件大小合理（建议每个图标 < 10KB）

## 测试建议

1. 在不同设备上测试 tabbar 显示效果
2. 检查图标在不同屏幕密度下的显示
3. 确保选中和未选中状态切换流畅
4. 验证图标和文字的间距是否合适

