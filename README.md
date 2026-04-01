# Apple Music 风格歌词视频模板

这是一个本地单曲模板项目，目标是让你直接在浏览器里播放一首歌、显示同步歌词、全屏后用 OBS 或系统录屏录成歌词视频。

项目重点：

- React + Vite + TypeScript
- 无后端、无数据库
- 优先使用 AMLL（`@applemusic-like-lyrics/*`）来负责歌词显示和歌词解析
- 面向本地单曲模板，而不是完整播放器产品

现在的页面流程是：

1. 先进入素材选择页
2. 选择本地音频、歌词、封面，或直接使用 demo 资源
3. 进入播放页后，封面会显示在歌词左侧
4. 全屏并开始录屏

## 1. 安装依赖

```bash
npm install
```

## 2. 本地运行

```bash
npm run dev
```

浏览器打开终端里显示的本地地址，通常是：

```bash
http://localhost:5173
```

生产构建：

```bash
npm run build
```

## 3. 当前资源结构

```text
public/
  audio/
    song.mp3
  lyrics/
    song.lrc
    song.ttml
  images/
    cover.jpg
src/
  components/
  config/
  hooks/
  lib/
```

默认已经放了可运行的示例素材：

- `public/audio/song.mp3`
- `public/lyrics/song.lrc`
- `public/images/cover.jpg`

它们只是演示资源，后续你可以直接替换成自己的歌曲。

## 4. 如何替换歌曲、歌词、封面

你现在有两种方式：

### 方式 A：直接在页面里选本地文件

启动项目后，首页就是选择页：

- 选音频文件
- 选歌词文件
- 选封面图
- 填歌曲标题和歌手
- 点击“进入播放页”

这种方式最适合快速试不同歌曲，不需要提前把文件复制到 `public/`。

注意：

- 本地选择歌词时，项目会按你原始文件名的扩展名来识别格式
- 所以 `.lrc / .ttml / .lys / .yrc` 这类后缀请保留正确

### 方式 B：继续使用 public 目录固定资源

如果你更喜欢“改文件后直接跑”的方式，也可以继续用下面这套固定资源结构。

### 替换资源文件

直接替换下面这些文件即可：

- 音频：[public/audio/song.mp3](/Users/lx/projects/applemusiclike/public/audio/song.mp3)
- 歌词：[public/lyrics/song.lrc](/Users/lx/projects/applemusiclike/public/lyrics/song.lrc)
- 封面：[public/images/cover.jpg](/Users/lx/projects/applemusiclike/public/images/cover.jpg)

### 修改歌曲信息

歌曲标题、歌手、资源路径都在这里：

- [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)

默认配置：

- `title`
- `artist`
- `audioPath`
- `lyricPath`
- `coverPath`

如果你改成别的文件名，比如 `my-song.mp3`、`my-song.ttml`，只需要同步改这一个配置文件，不需要改核心逻辑。

## 5. 歌词与音频是怎么连接的

关键位置有两个：

- [src/hooks/useLyricVideoPlayer.ts](/Users/lx/projects/applemusiclike/src/hooks/useLyricVideoPlayer.ts)
- [src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)

说明：

- `useLyricVideoPlayer` 会读取本地歌词文件并解析成 AMLL 需要的 `lyricLines`
- 同一个 hook 里会持续读取 `<audio>` 的 `currentTime`
- 然后把秒数转换成 AMLL 需要的“毫秒整数”
- [src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx) 再把 `lyricLines` 和 `currentTime` 传给 `LyricPlayer`

也就是说，真正的同步链路是：

```text
audio.currentTime -> currentTimeMs -> AMLL LyricPlayer
```

## 6. AMLL 在哪里初始化

两个主要接入点：

- 歌词播放器：
  [src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)
- 歌词解析：
  [src/lib/lyrics.ts](/Users/lx/projects/applemusiclike/src/lib/lyrics.ts)

当前使用到的 AMLL 模块：

- `@applemusic-like-lyrics/react`
- `@applemusic-like-lyrics/lyric`
- `@applemusic-like-lyrics/core`

其中：

- `LyricPlayer` 负责 Apple Music 风格歌词滚动与高亮
- `BackgroundRender` 负责动态流体背景
- 解析模块负责把 `.lrc / .yrc / .qrc / .lys / .eslrc / .ttml` 转成 AMLL 可用的数据结构

## 7. 当前 v1 的歌词同步方案

当前默认走的是稳定优先的 line-level MVP：

- 你放一个普通 `.lrc` 文件就能工作
- AMLL 会把每一行作为一个 `LyricLine`
- 同步和滚动效果已经是 Apple Music 风格的核心体验

这是最适合先录屏出片的版本。

## 8. 以后怎么升级到逐词 / 逐音节同步

项目结构已经为升级留了口：

- [src/lib/lyrics.ts](/Users/lx/projects/applemusiclike/src/lib/lyrics.ts)
- [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)

升级思路：

1. 准备更细粒度的歌词文件，比如 `.ttml`、`.lys`、`.yrc` 或 AMLL 可解析的其它逐词格式
2. 在 [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts) 里把 `lyricPath` 改到新文件
3. `loadLyricLines()` 会按扩展名自动调用对应的 AMLL 解析器
4. `LyricPlayer` 接口本身不需要重写

也就是说，升级重点主要在“歌词文件格式”本身，而不是页面结构。

项目里还附了一个示例：

- [public/lyrics/song.ttml](/Users/lx/projects/applemusiclike/public/lyrics/song.ttml)

它主要是给你看未来升级方向，不是默认使用文件。

## 9. 如果歌词不同步，先检查什么

优先排查下面几项：

1. 歌词时间戳是不是和音频版本一致。最常见问题是换了另一版伴奏或另一版 cut。
2. 歌词文件路径是否正确。检查 [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)。
3. 歌词格式是否被支持。当前支持 `.lrc / .yrc / .qrc / .lys / .eslrc / .ttml`。
4. 时间单位是否正常。AMLL 接收的是毫秒，项目里已经做了转换，不建议手动改这一段。
5. 浏览器是否成功加载了新文件。有时替换资源后需要刷新页面。

如果只是整体快了或慢了几百毫秒，通常说明：

- 歌词文件本身时间轴需要整体平移
- 或音频文件和歌词原始来源不是同一个版本

## 10. 如何改样式

主要样式入口：

- [src/styles.css](/Users/lx/projects/applemusiclike/src/styles.css)

你大概率会改这几个区域：

- 背景层：`.background-*`
- 歌词显示区域：`.lyrics-frame`
- 底部信息和控制条：`.playback-*`

如果你想让画面更像 Apple Music：

- 保持大字号、居中布局
- 控制对比度，不要太亮
- 让背景更糊、前景更清晰
- 尽量减少界面控件的存在感

## 11. 如何全屏并录得更干净

页面已经内置最小控制条，也支持快捷键：

- `Space`：播放 / 暂停
- `F`：进入 / 退出全屏
- `C`：打开 / 关闭配置面板
- `Esc`：关闭配置面板

现在底部区域默认只保留播放进度条和时间，像“换素材”“全屏”“歌词延时”这类操作都放进右侧配置面板里了。

### 歌词延时怎么用

播放页右侧配置面板里有一个 `歌词延时(ms)` 输入框：

- 正数：让歌词更晚出现
- 负数：让歌词更早出现
- 例如输入 `300` 表示延后 300ms
- 例如输入 `-250` 表示提前 250ms

### 字体建议

推荐优先尝试这些中文字体：

- 无衬线：`苹方 PingFang SC`、`思源黑体 Source Han Sans SC`、`HarmonyOS Sans SC`、`OPPO Sans`、`MiSans`
- 衬线：`思源宋体 Source Han Serif SC`、`Songti SC`、`方正书宋`、`霞鹜文楷`

建议搭配：

- 标题：`思源宋体` 或 `Songti SC`
- 歌词：`思源黑体` 或 `苹方`

配置面板里已经支持：

- 标题字体单独选择
- 歌词字体单独选择
- 标题本地字体文件上传
- 歌词本地字体文件上传

建议录制流程：

1. `npm run dev`
2. 打开页面
3. 按 `F` 全屏
4. 按 `Space` 开始播放
5. 把鼠标移开，开始 OBS 或系统录屏

想录得更干净时，建议：

- 浏览器缩放保持 100%
- 用全屏模式录
- 录制前把鼠标移出中间区域
- 如果你不想录到底部控制条，可以很容易在 [src/styles.css](/Users/lx/projects/applemusiclike/src/styles.css) 里进一步降低它的不透明度，或者临时隐藏

## 12. AMLL 相关 caveats

这个项目已经尽量优先使用 AMLL，但有几个现实 caveat 需要知道：

1. `@applemusic-like-lyrics/lyric` 是 wasm 包，所以 Vite 里额外加了 wasm 插件支持。
2. AMLL 官方包本身明确提示仍可能存在问题，所以这里采取了“稳定优先”的接法。
3. 当前最稳的录屏方案是：
   AMLL 负责歌词播放效果，歌词先用 line-level 文件，背景特效作为增强项而不是硬依赖。
4. 如果某台机器上动态背景性能一般，可以在 [src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx) 里临时去掉 `BackgroundRender`，只保留静态封面背景。

## 13. 适合新手改动的入口

如果你只想快速改歌，不用看太多代码：

1. 换资源文件
2. 改 [src/config/song.ts](/Users/lx/projects/applemusiclike/src/config/song.ts)
3. 跑 `npm run dev`

如果你想继续开发：

- 逻辑入口看 [src/App.tsx](/Users/lx/projects/applemusiclike/src/App.tsx)
- 同步逻辑看 [src/hooks/useLyricVideoPlayer.ts](/Users/lx/projects/applemusiclike/src/hooks/useLyricVideoPlayer.ts)
- 歌词解析看 [src/lib/lyrics.ts](/Users/lx/projects/applemusiclike/src/lib/lyrics.ts)
- 样式看 [src/styles.css](/Users/lx/projects/applemusiclike/src/styles.css)
