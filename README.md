# 自媒体运营大师 - Coze Bot 克隆版

这是一个完全复刻 [Coze 自媒体运营大师 V2](https://www.coze.cn/store/project/7483182254099562506) 的前端应用。

## 快速开始

### 1. 本地运行

双击打开 outputs/coze-clone/index.html 即可在浏览器中使用。

或通过本地服务器访问：
`ash
cd outputs/coze-clone
python -m http.server 8080
# 然后访问 http://localhost:8080
`

### 2. 配置 API（必需）

点击右下角 **"我的"** -> 齿轮图标进入设置页面：

**必须配置的 API：**
- **OpenAI API Key** - 用于所有 AI 生成功能（视频脚本、文案生成、对标分析等）

**推荐的免费/低成本 API：**
| 服务商 | API 地址 | 免费额度 |
|--------|----------|----------|
| 硅基流动 | https://api.siliconflow.cn/v1 | 注册送 ¥15 |
| 智谱AI | https://open.bigmodel.cn/api/paas/v4 | 新用户有额度 |
| OpenAI | https://api.openai.com/v1 | 需付费 |

**推荐模型：**
- gpt-4o-mini - 性价比高，速度快
- Qwen/Qwen2.5-72B-Instruct - 硅基流动，中文效果好
- glm-4 - 智谱AI，中文能力强

### 3. 免费功能（无需 API Key）

以下功能完全免费，不需要配置 API：

- ✅ **智能图片** - 使用 Pollinations.ai 免费 AI 绘画
- ✅ **文生音频** - 使用 TTSMaker 免费 TTS 工具
- ✅ **视频下载** - 提供解析工具链接

## 功能清单

| 功能 | 是否需要 API | 说明 |
|------|-------------|------|
| 🎬 视频脚本生成 | ✅ 需要 | AI 生成专业分镜头脚本 |
| ✍️ 文案生成 | ✅ 需要 | 多平台文案创作 |
| 🔄 文案二创 | ✅ 需要 | 提升原创度改写 |
| 📊 对标分析 | ✅ 需要 | 竞品账号深度分析 |
| 🖼️ 智能图片 | ❌ 免费 | AI 生成配图 |
| 🎵 文生音频 | ❌ 免费 | 文字转语音 |
| 📰 资讯获取 | ✅ 需要 | 热点资讯聚合 |
| 📱 图文生成 | ✅ 需要 | 小红书/微博图文笔记 |
| 🤖 数字人 | ⚠️ 部分 | 提供音频+文案方案 |
| 📥 视频下载 | ❌ 免费 | 提供解析工具链接 |

## 技术架构

- **纯前端** - HTML + CSS + JavaScript，无任何框架依赖
- **响应式设计** - 模拟手机界面（430px 宽度）
- **本地存储** - API Key 和作品数据保存在 localStorage
- **API 兼容** - 支持任何 OpenAI 兼容接口

## 文件结构

`
outputs/coze-clone/
├── index.html    # 主页面（32KB）
├── style.css     # 样式表（17KB）
└── app.js        # 应用逻辑（31KB）
`

## 注意事项

1. **API Key 安全**：您的 API Key 仅存储在本地浏览器中，不会上传到任何服务器
2. **CORS 限制**：部分 API 可能需要浏览器插件解决 CORS 问题
3. **音频生成**：Edge TTS 有 CORS 限制，建议使用 TTSMaker 在线工具
4. **图片生成**：Pollinations.ai 完全免费，质量中等

## 与原版的区别

| 特性 | Coze 原版 | 本克隆版 |
|------|-----------|----------|
| 部署方式 | Coze 平台 | 本地 HTML 文件 |
| AI 能力 | Coze 工作流 | 直接调用 OpenAI 兼容 API |
| 图片生成 | 内部模型 | Pollinations.ai |
| 音频生成 | 内部 TTS | TTSMaker + Edge TTS |
| 视频下载 | 后端解析 | 前端工具链接 |
| 定制性 | 低 | 高（开源代码） |

## 许可证

本项目仅供学习和研究使用。

---

**版本**: V2.0  
**更新日期**: 2026-07-06
