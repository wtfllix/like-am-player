# Apple Music Like Lyric Video Template

一个用于本地歌词视频预览和录屏的前端模板，基于 React + Vite + TypeScript。

它不是完整播放器产品，更适合这样使用：

- 导入一首歌的音频、歌词、封面
- 在浏览器里预览 Apple Music 风格歌词效果
- 微调字体和歌词延时
- 全屏后用系统录屏或 OBS 输出视频

## 适合谁

如果你想快速做一支单曲歌词视频，这个项目会比较合适：

- 不需要后端
- 不需要数据库
- 本地素材即可开始
- 可以先用 Demo 跑通流程，再替换成自己的歌

## 快速开始

```bash
npm install
npm run dev
```

默认开发地址：

```bash
http://localhost:5173
```

生产构建：

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 使用方式

### 方式 1：直接导入本地素材

进入首页后，填写歌曲信息并选择：

- 音频文件
- 歌词文件
- 封面图片

然后点击“进入播放页”。

这是最推荐的方式，不需要改代码。

### 方式 2：先用 Demo 素材试跑

首页点击“使用 Demo 素材”即可。

默认 Demo 资源位于：

- [public/audio/song.mp3](/Users/lx/projects/applemusiclike/public/audio/song.mp3)
- [public/lyrics/song.lrc](/Users/lx/projects/applemusiclike/public/lyrics/song.lrc)
- [public/lyrics/song.ttml](/Users/lx/projects/applemusiclike/public/lyrics/song.ttml)
- [public/images/cover.jpg](/Users/lx/projects/applemusiclike/public/images/cover.jpg)

## 推荐上手顺序

1. 先运行项目并点击“使用 Demo 素材”
2. 确认音频播放、歌词滚动和背景效果正常
3. 再换成你自己的音频、歌词和封面
4. 进入播放页后按 `C` 打开配置面板微调
5. 按 `F` 全屏后开始录屏

## 支持内容

- 歌词格式：`.lrc`、`.yrc`、`.qrc`、`.lys`、`.eslrc`、`.ttml`
- 字体切换：标题字体、歌词字体
- 本地字体上传
- 歌词整体延时微调
- 全屏播放录制

如果你只是想尽快出片，建议优先使用 `.lrc`。

## 快捷键

- `Space`：播放 / 暂停
- `C`：打开 / 关闭配置面板
- `F`：进入 / 退出全屏
- `Esc`：关闭配置面板

## 固定替换默认歌曲

如果你想把仓库里的 Demo 素材换成自己的默认歌曲，可以替换 `public/` 下的资源，并更新配置文件：

- [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)

这里主要维护：

- `title`
- `artist`
- `audioPath`
- `lyricPath`
- `coverPath`

## 技术栈

- React 18
- Vite 5
- TypeScript
- `@applemusic-like-lyrics/react`

## 部署到 GitHub Pages

仓库已经包含 GitHub Pages 自动部署工作流：

- push 到 `main` 后会自动构建并部署
- 需要在 GitHub 仓库设置里把 Pages Source 设为 `GitHub Actions`

如果仓库地址是 `https://github.com/wtfllix/like-am-player`，部署后的地址通常会是：

```bash
https://wtfllix.github.io/like-am-player/
```
