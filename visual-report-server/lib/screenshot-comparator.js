import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export function compareImages(baselinePath, actualPath, diffOutputPath, options = {}) {
  const threshold = options.pixelThreshold ?? 0.1;

  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const actualImg = PNG.sync.read(fs.readFileSync(actualPath));

  const width = Math.max(baselineImg.width, actualImg.width);
  const height = Math.max(baselineImg.height, actualImg.height);

  const resizedBaseline = resizeImage(baselineImg, width, height);
  const resizedActual = resizeImage(actualImg, width, height);

  const diffImg = new PNG({ width, height });
  const diffPixels = pixelmatch(
    resizedBaseline.data,
    resizedActual.data,
    diffImg.data,
    width,
    height,
    { threshold }
  );

  if (diffOutputPath) {
    const dir = path.dirname(diffOutputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(diffOutputPath, PNG.sync.write(diffImg));
  }

  const totalPixels = width * height;
  const diffPercent = (diffPixels / totalPixels) * 100;

  return {
    diffPixels,
    totalPixels,
    diffPercent: Math.round(diffPercent * 1000) / 1000,
    width,
    height,
  };
}

function resizeImage(img, width, height) {
  if (img.width === width && img.height === height) return img;
  const resized = new PNG({ width, height, fill: true });
  resized.data.fill(0);
  for (let y = 0; y < Math.min(img.height, height); y++) {
    for (let x = 0; x < Math.min(img.width, width); x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      resized.data[dstIdx] = img.data[srcIdx];
      resized.data[dstIdx + 1] = img.data[srcIdx + 1];
      resized.data[dstIdx + 2] = img.data[srcIdx + 2];
      resized.data[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }
  return resized;
}
