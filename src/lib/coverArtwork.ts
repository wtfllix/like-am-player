interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export const coverArtworkTemplates = [
  {
    id: "xiaohongshu-square",
    label: "1:1",
    platform: "小红书",
    description: "方形海报感，适合笔记封面和社媒主图。",
    width: 1080,
    height: 1080,
  },
  {
    id: "bilibili-standard",
    label: "4:3",
    platform: "B站",
    description: "更适合横版封面，信息区更突出。",
    width: 1440,
    height: 1080,
  },
  {
    id: "bilibili-wide",
    label: "16:9",
    platform: "B站",
    description: "宽屏封面，适合视频头图和横版缩略图。",
    width: 1920,
    height: 1080,
  },
] as const;

export type CoverArtworkTemplateId = (typeof coverArtworkTemplates)[number]["id"];

interface CoverArtworkOptions {
  artist: string;
  coverSrc: string;
  templateId: CoverArtworkTemplateId;
  title: string;
  titleFontFamily: string;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgbToString(color: RGBColor, alpha = 1) {
  return `rgba(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)}, ${alpha})`;
}

function mixColor(a: RGBColor, b: RGBColor, ratio: number): RGBColor {
  const weight = clamp(ratio, 0, 1);

  return {
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  };
}

function brighten(color: RGBColor, amount: number) {
  return mixColor(color, { r: 255, g: 255, b: 255 }, amount);
}

function darken(color: RGBColor, amount: number) {
  return mixColor(color, { r: 0, g: 0, b: 0 }, amount);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("封面图片加载失败，请换一张图片后重试。"));
    image.src = src;
  });
}

function extractPalette(image: HTMLImageElement) {
  const sampleCanvas = document.createElement("canvas");
  const sampleSize = 48;
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sampleContext = sampleCanvas.getContext("2d");

  if (!sampleContext) {
    throw new Error("当前浏览器环境不支持封面生成。");
  }

  sampleContext.drawImage(image, 0, 0, sampleSize, sampleSize);
  const { data } = sampleContext.getImageData(0, 0, sampleSize, sampleSize);

  let totalWeight = 0;
  let red = 0;
  let green = 0;
  let blue = 0;
  let brightest = { r: 160, g: 160, b: 160 };
  let darkest = { r: 32, g: 32, b: 32 };
  let brightestLuma = -1;
  let darkestLuma = Number.POSITIVE_INFINITY;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255;

    if (alpha < 0.4) {
      continue;
    }

    const current = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
    };
    const saturation =
      (Math.max(current.r, current.g, current.b) - Math.min(current.r, current.g, current.b)) / 255;
    const weight = 0.35 + saturation * 0.65;
    const luma = current.r * 0.299 + current.g * 0.587 + current.b * 0.114;

    red += current.r * weight;
    green += current.g * weight;
    blue += current.b * weight;
    totalWeight += weight;

    if (luma > brightestLuma) {
      brightest = current;
      brightestLuma = luma;
    }

    if (luma < darkestLuma) {
      darkest = current;
      darkestLuma = luma;
    }
  }

  const base =
    totalWeight > 0
      ? {
          r: red / totalWeight,
          g: green / totalWeight,
          b: blue / totalWeight,
        }
      : { r: 88, g: 105, b: 140 };

  return {
    accent: brighten(base, 0.18),
    base: darken(base, 0.08),
    highlight: brighten(brightest, 0.08),
    shadow: darken(darkest, 0.28),
  };
}

function drawRoundedImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.save();
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.clip();
  context.drawImage(image, x, y, width, height);
  context.restore();
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const normalized = text.trim().replace(/\s+/g, " ");

  if (!normalized) {
    return [""];
  }

  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      let chunk = "";

      for (const char of word) {
        const nextChunk = `${chunk}${char}`;

        if (context.measureText(nextChunk).width <= maxWidth) {
          chunk = nextChunk;
        } else {
          if (chunk) {
            lines.push(chunk);
          }
          chunk = char;
        }
      }

      currentLine = chunk;
    }

    if (lines.length === maxLines) {
      break;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  if (lines.length > maxLines) {
    lines.length = maxLines;
  }

  if (lines.length === maxLines) {
    const lastLine = lines[maxLines - 1];

    if (context.measureText(lastLine).width > maxWidth) {
      let trimmed = lastLine;

      while (trimmed.length > 1 && context.measureText(`${trimmed}…`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
      }

      lines[maxLines - 1] = `${trimmed}…`;
    }
  }

  return lines;
}

function drawBackground(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  palette: ReturnType<typeof extractPalette>,
) {
  context.fillStyle = rgbToString(darken(palette.shadow, 0.18));
  context.fillRect(0, 0, width, height);

  context.save();
  context.filter = `blur(${Math.round(height * 0.06)}px) saturate(1.18)`;
  context.globalAlpha = 0.72;
  context.drawImage(image, -width * 0.06, -height * 0.1, width * 1.12, height * 1.2);
  context.restore();

  const radialHighlight = context.createRadialGradient(
    width * 0.22,
    height * 0.18,
    height * 0.04,
    width * 0.22,
    height * 0.18,
    height * 0.7,
  );
  radialHighlight.addColorStop(0, rgbToString(brighten(palette.highlight, 0.2), 0.38));
  radialHighlight.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = radialHighlight;
  context.fillRect(0, 0, width, height);

  const verticalOverlay = context.createLinearGradient(0, 0, 0, height);
  verticalOverlay.addColorStop(0, rgbToString(darken(palette.base, 0.25), 0.18));
  verticalOverlay.addColorStop(0.45, rgbToString(darken(palette.base, 0.16), 0.34));
  verticalOverlay.addColorStop(1, rgbToString(darken(palette.shadow, 0.34), 0.92));
  context.fillStyle = verticalOverlay;
  context.fillRect(0, 0, width, height);
}

function drawSquareTemplate(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  title: string,
  artist: string,
  titleFontFamily: string,
  palette: ReturnType<typeof extractPalette>,
) {
  const mainCoverSize = height * 0.54;
  const mainCoverX = (width - mainCoverSize) / 2;
  const mainCoverY = height * 0.11;
  const textMaxWidth = width * 0.76;
  const titleY = mainCoverY + mainCoverSize + height * 0.12;
  const artistY = height * 0.88;

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.28)";
  context.shadowBlur = height * 0.05;
  context.shadowOffsetY = height * 0.02;
  drawRoundedImage(context, image, mainCoverX, mainCoverY, mainCoverSize, mainCoverSize, height * 0.03);
  context.restore();

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.font = `700 ${Math.round(height * 0.064)}px ${titleFontFamily}`;
  const titleLines = wrapText(context, title, textMaxWidth, 2);
  const titleLineHeight = height * 0.075;
  const titleStartY = titleY - (Math.max(0, titleLines.length - 1) * titleLineHeight) / 2;

  titleLines.forEach((line, index) => {
    context.fillText(line, width / 2, titleStartY + titleLineHeight * index, textMaxWidth);
  });

  context.fillStyle = "rgba(255, 255, 255, 0.82)";
  context.font = `600 ${Math.round(height * 0.048)}px ${titleFontFamily}`;
  context.fillText(artist.trim() || "Unknown Artist", width / 2, artistY, textMaxWidth);
}

function drawLandscapeTemplate(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  title: string,
  artist: string,
  titleFontFamily: string,
  palette: ReturnType<typeof extractPalette>,
  templateId: CoverArtworkTemplateId,
) {
  const isWide = templateId === "bilibili-wide";
  const coverSize = height * (isWide ? 0.58 : 0.56);
  const layoutInsetX = width * (isWide ? 0.06 : 0.065);
  const contentWidth = width - layoutInsetX * 2;
  const leftZoneWidth = contentWidth * (isWide ? 0.42 : 0.44);
  const rightZoneWidth = contentWidth - leftZoneWidth;
  const coverX = layoutInsetX + (leftZoneWidth - coverSize) / 2;
  const coverY = (height - coverSize) / 2;
  const infoX = layoutInsetX + leftZoneWidth;
  const textMaxWidth = rightZoneWidth * (isWide ? 0.88 : 0.84);
  const textCenterX = infoX + rightZoneWidth / 2;

  const atmosphereGlow = context.createRadialGradient(
    width * 0.68,
    height * 0.36,
    height * 0.08,
    width * 0.68,
    height * 0.36,
    width * 0.62,
  );
  atmosphereGlow.addColorStop(0, rgbToString(brighten(palette.accent, 0.14), 0.12));
  atmosphereGlow.addColorStop(0.45, rgbToString(brighten(palette.base, 0.08), 0.06));
  atmosphereGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = atmosphereGlow;
  context.fillRect(0, 0, width, height);

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.3)";
  context.shadowBlur = height * 0.06;
  context.shadowOffsetY = height * 0.02;
  drawRoundedImage(context, image, coverX, coverY, coverSize, coverSize, height * 0.03);
  context.restore();

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "rgba(255, 255, 255, 0.98)";
  context.font = `700 ${Math.round(height * (isWide ? 0.082 : 0.086))}px ${titleFontFamily}`;
  const titleLines = wrapText(context, title, textMaxWidth, 2);
  const titleLineHeight = height * (isWide ? 0.092 : 0.096);
  const artistOffset = height * 0.04;
  const textBlockHeight = titleLineHeight * titleLines.length + artistOffset;
  const titleY = height / 2 - textBlockHeight / 2 + titleLineHeight * 0.78;

  titleLines.forEach((line, index) => {
    context.fillText(line, textCenterX, titleY + titleLineHeight * index, textMaxWidth);
  });

  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.font = `600 ${Math.round(height * (isWide ? 0.05 : 0.052))}px ${titleFontFamily}`;
  context.fillText(
    artist.trim() || "Unknown Artist",
    textCenterX,
    titleY + titleLineHeight * titleLines.length + artistOffset,
    textMaxWidth,
  );
}

export async function renderCoverArtwork(options: CoverArtworkOptions) {
  const template =
    coverArtworkTemplates.find((item) => item.id === options.templateId) ?? coverArtworkTemplates[0];
  const image = await loadImage(options.coverSrc);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("当前浏览器环境不支持封面生成。");
  }

  const palette = extractPalette(image);
  drawBackground(context, image, template.width, template.height, palette);

  if (template.id === "xiaohongshu-square") {
    drawSquareTemplate(
      context,
      image,
      template.width,
      template.height,
      options.title,
      options.artist,
      options.titleFontFamily,
      palette,
    );
  } else {
    drawLandscapeTemplate(
      context,
      image,
      template.width,
      template.height,
      options.title,
      options.artist,
      options.titleFontFamily,
      palette,
      template.id,
    );
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    template,
  };
}
