interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface CoverArtworkOptions {
  artist: string;
  coverSrc: string;
  size?: number;
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

function fitCoverRect(image: HTMLImageElement, targetSize: number) {
  const coverRatio = image.width / image.height;
  let drawWidth = targetSize;
  let drawHeight = targetSize;

  if (coverRatio > 1) {
    drawHeight = targetSize / coverRatio;
  } else {
    drawWidth = targetSize * coverRatio;
  }

  return {
    height: drawHeight,
    width: drawWidth,
    x: (targetSize - drawWidth) / 2,
    y: (targetSize - drawHeight) / 2,
  };
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

export async function renderSquareCoverArtwork(options: CoverArtworkOptions) {
  const size = options.size ?? 1080;
  const image = await loadImage(options.coverSrc);
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("当前浏览器环境不支持封面生成。");
  }

  const palette = extractPalette(image);
  const mainCoverSize = size * 0.54;
  const mainCoverX = (size - mainCoverSize) / 2;
  const mainCoverY = size * 0.11;
  const textMaxWidth = size * 0.76;
  const titleY = mainCoverY + mainCoverSize + size * 0.12;
  const artistY = size * 0.895;

  context.fillStyle = rgbToString(darken(palette.shadow, 0.18));
  context.fillRect(0, 0, size, size);

  context.save();
  context.filter = `blur(${Math.round(size * 0.045)}px) saturate(1.18)`;
  context.globalAlpha = 0.72;
  context.drawImage(image, -size * 0.08, -size * 0.08, size * 1.16, size * 1.16);
  context.restore();

  const radialHighlight = context.createRadialGradient(
    size * 0.28,
    size * 0.18,
    size * 0.05,
    size * 0.28,
    size * 0.18,
    size * 0.7,
  );
  radialHighlight.addColorStop(0, rgbToString(brighten(palette.highlight, 0.2), 0.38));
  radialHighlight.addColorStop(1, "rgba(0, 0, 0, 0)");
  context.fillStyle = radialHighlight;
  context.fillRect(0, 0, size, size);

  const verticalOverlay = context.createLinearGradient(0, 0, 0, size);
  verticalOverlay.addColorStop(0, rgbToString(darken(palette.base, 0.25), 0.2));
  verticalOverlay.addColorStop(0.42, rgbToString(darken(palette.base, 0.16), 0.36));
  verticalOverlay.addColorStop(1, rgbToString(darken(palette.shadow, 0.34), 0.9));
  context.fillStyle = verticalOverlay;
  context.fillRect(0, 0, size, size);

  context.save();
  context.shadowColor = "rgba(0, 0, 0, 0.28)";
  context.shadowBlur = size * 0.05;
  context.shadowOffsetY = size * 0.02;
  drawRoundedImage(context, image, mainCoverX, mainCoverY, mainCoverSize, mainCoverSize, size * 0.03);
  context.restore();

  const fitRect = fitCoverRect(image, mainCoverSize);
  context.save();
  context.globalAlpha = 0.08;
  drawRoundedImage(
    context,
    image,
    mainCoverX + fitRect.x,
    mainCoverY + fitRect.y,
    fitRect.width,
    fitRect.height,
    size * 0.03,
  );
  context.restore();

  context.textAlign = "center";
  context.textBaseline = "alphabetic";
  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.font = `700 ${Math.round(size * 0.064)}px ${options.titleFontFamily}`;
  const titleLines = wrapText(context, options.title, textMaxWidth, 2);
  const titleLineHeight = size * 0.075;
  const titleStartY = titleY - (Math.max(0, titleLines.length - 1) * titleLineHeight) / 2;

  titleLines.forEach((line, index) => {
    context.fillText(line, size / 2, titleStartY + titleLineHeight * index, textMaxWidth);
  });

  context.fillStyle = "rgba(255, 255, 255, 0.66)";
  context.font = `500 ${Math.round(size * 0.039)}px ${options.titleFontFamily}`;
  context.fillText(options.artist.trim() || "Unknown Artist", size / 2, artistY, textMaxWidth);

  return canvas.toDataURL("image/png");
}
