#*: Spreads particles into chaotic noise.
- **Closed Fist (Congregate)**: Pulls particles tightly into the target shape (Sphere, Heart, Vortex, etc.).
- **Smart Tracking**: Uses 3D world landmarks to calculate "openness" accurately, regardless of how close your hand is to the camera.
- **张开手掌 (驱散)**: 将粒子散布成混沌噪音状态。
- **握紧拳头 (聚合)**: 将粒子紧紧吸附到目标形状（球体、爱心、旋涡等）。
- **智能追踪**: 使用 3D 世界地标计算“张开度”，无论手离摄像头多远都能精确控制。

### 🎵 Audio Reactivity / 音频响应
- **Beat Detection**: Particles pulse in size and brightness with the bass.
- **Frequency Jitter**: High frequencies add energetic vibration to the particle field.
- **节奏检测**: 粒子的大小和亮度随 Aether Sandbox / 以太沙盒

**Aether Sandbox** is a next-generation interactive 3D particle system running entirely in the browser. It combines computer vision (MediaPipe) and audio analysis (Web Audio API) to create an immersive, reactive digital art experience.

**以太沙盒** 是一个完全在浏览器中运行的下一代交互式 3D 粒子系统。它结合了计算机视觉 (MediaPipe) 和音频分析 (Web Audio API)，创造身临其境的反应式数字艺术体验。

![Aether Sandbox Preview](https://via.placeholder.com/800x400.png?text=Aether+Sandbox+Preview)

---

## ✨ Features / 功能特性

### 🖐 Gesture Control / 手势控制
- **Open Palm (Scatter)*低音脉动。
- **频率抖动**: 高频声音为粒子场增添充满活力的振动。

### 🎨 Creative Tools / 创意工具
- **Custom Shapes**: Use the "Pen" tool to draw 2D shapes that transform into 3D particle clouds.
- **Zen Mode**: Toggle the UI off for a distraction-free visual experience.
- **Screenshot**: Capture high-quality stills of your creations.
- **自定义形状**: 使用“钢笔”工具绘制 2D 形状，将其转化为 3D 粒子云。
- **禅模式**: 关闭 UI，享受无干扰的视觉体验。
- **截图**: 捕捉您作品的高质量静态图像。

---

## 🛠 Tech Stack / 技术栈

- **Core**: React 18, TypeScript, Vite
- **3D Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Computer Vision**: Google MediaPipe (Hand Landmarker Task)
- **Styling**: Tailwind CSS (Glassmorphism UI)
- **Audio**: Web Audio API (FFT Analyser)

---

## 🚀 How to Run / 如何运行

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
3. **Permissions**:
   - Allow **Camera** access when prompted (for hand tracking).
   - Click the **Microphone** icon to enable audio reactivity.
   
1. **安装依赖**:
   ```bash
   npm install
   ```
2. **启动开发服务器**:
   ```bash
   npm run dev
   ```
3. **权限设置**:
   - 提示时允许**摄像头**访问（用于手部追踪）。
   - 点击**麦克风**图标启用音频响应功能。

---

## 🎮 Controls / 操作指南

| Icon / 图标 | Action / 动作 | Description / 描述 |
|:---:|:---:|:---|
| 📦 / ❤️ / 🌪️ | **Change Shape** | Switch between Sphere, Heart, and Vortex presets.<br>切换球体、爱心和旋涡预设。 |
| 🖊️ | **Draw Custom** | Open the canvas to draw your own particle shape.<br>打开画布绘制自定义粒子形状。 |
| 🎨 | **Color Picker** | Select preset colors or choose a custom neon hue.<br>选择预设颜色或自定义霓虹色调。 |
| 📷 | **Screenshot** | Save the current view as a PNG.<br>将当前视图保存为 PNG。 |
| 🎤 | **Toggle Audio** | Enable/Disable microphone reactivity.<br>启用/禁用麦克风响应。 |
| 👁️ | **Zen Mode** | Hide all UI controls (Click top-right to exit).<br>隐藏所有 UI 控件（点击右上角退出）。 |
