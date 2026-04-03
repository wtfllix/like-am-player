# Apple Music Like Lyric Video Template

一个基于 React + Vite + TypeScript 的本地歌词视频模板，用来在浏览器里预览歌曲、显示同步歌词，并配合全屏录制输出成片。

这个项目不是完整播放器产品，而是一个偏创作流程的单曲模板：

- 本地导入音频、歌词、封面即可开始
- 使用 AMLL 渲染 Apple Music 风格歌词和动态背景
- 适合快速试歌、调歌词、录制成视频
- 无后端、无数据库、开箱即跑

## 分支说明

仓库当前主要维护两个分支：

### `main`

默认主线分支，适合直接使用和继续迭代。

- 启动页为全页双栏布局
- 播放页为横向结构，封面在左、歌词在右
- 配置面板已同步最近一版的更紧凑视觉设计
- 适合桌面预览、横版录屏和常规模板开发

### `codex/portrait-template`

竖版模板实验分支，保留了更偏短视频/移动端录制的那套结构。

- 播放页布局偏竖版
- 包含更强的歌词密度、字号等实验性配置
- 适合继续探索 portrait / reel / short video 方向
- 不是当前默认稳定主线，但可以作为样式和交互参考来源

如果你只是想直接使用项目，请优先基于 `main`。

## 效果预览

`main` 分支当前的默认体验：

- 启动页采用全页双栏布局
- 左侧是连续说明文案和使用提示
- 右侧是导入素材表单
- 播放页为横向结构，封面在左、歌词在右
- 配置面板收在右侧抽屉里，适合录屏前快速微调

`codex/portrait-template` 分支更偏竖版展示：

- 播放结构更适合短视频画幅
- 歌词区和信息区更偏移动端视觉节奏
- 适合继续做 reel / short / portrait 模板探索

## 功能概览

- 首页可直接导入音频、歌词、封面
- 支持使用仓库内置 Demo 素材快速预览
- 支持 `.lrc`、`.ttml` 等多种歌词格式
- 支持切换标题字体、歌词字体、加载本地字体文件
- 支持歌词整体延时微调
- 支持全屏播放，便于系统录屏或 OBS 录制

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm run dev
```

默认开发地址通常是：

```bash
http://localhost:5173
```

### 3. 生产构建

```bash
npm run build
```

### 4. 本地预览构建结果

```bash
npm run preview
```

## 使用方式

### 方式 A：在页面里直接导入本地素材

这是最推荐的使用方式。

1. 启动项目进入首页
2. 填写歌曲标题和歌手
3. 选择音频文件
4. 选择歌词文件
5. 选择封面图片
6. 点击“进入播放页”

这种方式适合频繁切歌，不需要手动改代码或覆盖 `public/` 文件。

### 方式 B：使用仓库默认 Demo 资源

首页直接点击“使用 Demo 素材”即可进入播放页。

仓库内默认资源位置：

- [public/audio/song.mp3](/Users/lx/projects/applemusiclike/public/audio/song.mp3)
- [public/lyrics/song.lrc](/Users/lx/projects/applemusiclike/public/lyrics/song.lrc)
- [public/lyrics/song.ttml](/Users/lx/projects/applemusiclike/public/lyrics/song.ttml)
- [public/images/cover.jpg](/Users/lx/projects/applemusiclike/public/images/cover.jpg)

## 推荐工作流

如果你是第一次使用这个项目，推荐按下面顺序走：

1. 先在 `main` 分支运行项目
2. 点击“使用 Demo 素材”确认播放、歌词和背景都正常
3. 再切换成自己的音频、歌词和封面
4. 进入播放页后按 `C` 打开配置面板微调字体和歌词延时
5. 按 `F` 全屏后开始用系统录屏或 OBS 录制

如果你的目标是做竖版模板，可以在熟悉主流程后再切到 `codex/portrait-template` 继续调整。

## 如何替换默认歌曲资源

如果你希望固定使用某一首歌，而不是每次都从页面导入，可以直接替换 `public/` 里的资源文件，并更新歌曲配置：

- 歌曲配置文件：[src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)

这个文件里主要维护：

- `title`
- `artist`
- `audioPath`
- `lyricPath`
- `coverPath`

只要这些路径和文件名对应上，播放器主逻辑不需要额外改动。

## 当前页面流程

项目当前默认流程如下：

1. 进入启动页
2. 使用 Demo 或导入本地素材
3. 进入播放页预览歌词同步效果
4. 按 `C` 打开配置面板做微调
5. 按 `F` 全屏后开始录屏

## 快捷键

- `Space`：播放 / 暂停
- `F`：进入 / 退出全屏
- `C`：打开 / 关闭配置面板
- `Esc`：关闭配置面板

## 配置面板可以做什么

当前 `main` 分支配置面板支持：

- 回到素材页
- 回到歌曲开头
- 全屏
- 切换标题字体预设
- 切换歌词字体预设
- 上传本地标题字体文件
- 上传本地歌词字体文件
- 调整歌词整体延时

相关组件位置：

- [src/components/SettingsPanel.tsx](/Users/lx/projects/applemusiclike/src/components/SettingsPanel.tsx)

## 歌词同步是怎么工作的

核心同步链路非常简单：

```text
audio.currentTime -> currentTimeMs -> LyricPlayer
```

相关文件：

- 歌词解析：[src/lib/lyrics.ts](/Users/lx/projects/applemusiclike/src/lib/lyrics.ts)
- 播放状态与时间同步：[src/hooks/useLyricVideoPlayer.ts](/Users/lx/projects/applemusiclike/src/hooks/useLyricVideoPlayer.ts)
- AMLL 渲染接入：[src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)

项目会读取歌词文件内容，解析成 AMLL 可消费的 `lyricLines`，然后持续把音频播放时间转换成毫秒传给 `LyricPlayer`。

## 支持的歌词格式

当前项目支持这些常见格式：

- `.lrc`
- `.yrc`
- `.qrc`
- `.lys`
- `.eslrc`
- `.ttml`

如果只是想尽快出片，优先建议使用 `.lrc`。  
如果你后续要升级到逐词或更细粒度的歌词同步，可以改用 `.ttml`、`.lys`、`.yrc` 这类格式。

## 样式入口

主要样式文件：

- [src/styles.css](/Users/lx/projects/applemusiclike/src/styles.css)

主要组件文件：

- 启动页：[src/components/SetupPage.tsx](/Users/lx/projects/applemusiclike/src/components/SetupPage.tsx)
- 配置面板：[src/components/SettingsPanel.tsx](/Users/lx/projects/applemusiclike/src/components/SettingsPanel.tsx)
- 底部播放信息：[src/components/PlaybackDock.tsx](/Users/lx/projects/applemusiclike/src/components/PlaybackDock.tsx)
- 应用主入口：[src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)

## 主要模块

### 启动页

- 组件位置：[src/components/SetupPage.tsx](/Users/lx/projects/applemusiclike/src/components/SetupPage.tsx)
- 负责导入音频、歌词、封面和歌曲基础信息
- 支持直接使用 Demo 素材进入播放页

### 播放页

- 组件入口：[src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)
- 负责背景、封面、歌词播放器和底部信息区组合
- 当前默认是适合桌面录制的横向布局

### 配置面板

- 组件位置：[src/components/SettingsPanel.tsx](/Users/lx/projects/applemusiclike/src/components/SettingsPanel.tsx)
- 负责字体切换、本地字体上传、歌词延时和录屏前快捷操作

### 播放状态管理

- Hook 位置：[src/hooks/useLyricVideoPlayer.ts](/Users/lx/projects/applemusiclike/src/hooks/useLyricVideoPlayer.ts)
- 负责音频时间、进度、歌词加载和播放状态同步

## 仓库结构

```text
public/
  audio/
  images/
  lyrics/
src/
  components/
  config/
  hooks/
  lib/
```

## 常见问题

### 歌词不同步怎么办

优先排查这几项：

1. 歌词时间戳和音频是否来自同一版本
2. 歌词文件后缀是否正确保留
3. 歌词文件格式是否在支持列表内
4. 是否需要在配置面板里做几百毫秒级的整体延时微调

### 为什么推荐先用 Demo 跑一遍

因为这能先验证三件事：

- 浏览器是否能正常播放音频
- 歌词解析和滚动是否正常
- 录屏流程是否顺手

先确认流程通，再替换成自己的素材，排查效率会更高。

## 技术栈

- React 18
- Vite 5
- TypeScript
- `@applemusic-like-lyrics/react`
- `@applemusic-like-lyrics/lyric`
- `@applemusic-like-lyrics/core`

## 适合继续扩展的方向

- 竖版播放页模板
- 更多歌词排版控制项
- 导出配置预设
- 多首歌切换
- 更细粒度的逐词歌词支持
