# AI Xiaoming疯狂8点 (Crazy Eights)

一款以森林鸟类为主题的高性能疯狂8点扑克游戏，具有智能AI对手。

## 特色

- **精美视觉**: 采用森林鸟类肖像作为卡面设计。
- **智能AI**: 与名为“小明”的AI对手进行对战。
- **流畅动画**: 使用 `motion` 库实现的平滑卡牌过渡和交互。
- **响应式设计**: 完美适配桌面和移动端。

## 技术栈

- **框架**: React 19 + Vite
- **动画**: Motion (原 Framer Motion)
- **样式**: Tailwind CSS
- **图标**: Lucide React

## 本地开发

1. 安装依赖:
   ```bash
   npm install
   ```

2. 启动开发服务器:
   ```bash
   npm run dev
   ```

3. 构建生产版本:
   ```bash
   npm run build
   ```

## 部署到 Vercel

该项目已配置 `vercel.json`，可直接导入 Vercel 进行部署。

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入该仓库。
3. 框架预设选择 **Vite**。
4. 点击 **Deploy** 即可。
