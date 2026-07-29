function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function hammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return Infinity;
  let d = 0;
  for (let i = 0; i < h1.length; i++) { if (h1[i] !== h2[i]) d++; }
  return d;
}

async function computePHash(imgUrl) {
  const img = await loadImage(imgUrl);
  const canvas = document.createElement('canvas');
  canvas.width = 8; canvas.height = 8;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, 8, 8);
  const data = ctx.getImageData(0, 0, 8, 8).data;
  const gray = [];
  for (let i = 0; i < 64; i++) gray.push((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
  const avg = gray.reduce((a, b) => a + b, 0) / 64;
  return gray.map(g => g >= avg ? '1' : '0').join('');
}

async function checkBlur(imgUrl) {
  const img = await loadImage(imgUrl);
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  const gray = [];
  for (let i = 0; i < size * size; i++) gray.push((data[i * 4] + data[i * 4 + 1] + data[i * 4 + 2]) / 3);
  let sum = 0, sumSq = 0, count = 0;
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x;
      const lap = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - size] - gray[idx + size];
      sum += lap; sumSq += lap * lap; count++;
    }
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  return { variance, isBlurry: variance < 80, message: variance < 80 ? 'Heavy blur detected. Image may not produce good conditioning.' : null };
}

export async function runQC(imgUrl, existingRefs = []) {
  const result = { status: 'pass', messages: [], phash: null, shortEdge: null, isDuplicate: false, duplicateSlot: null };

  try {
    const img = await loadImage(imgUrl);
    const shortEdge = Math.min(img.naturalWidth, img.naturalHeight);
    result.shortEdge = shortEdge;
    if (shortEdge < 512) { result.status = 'warn'; result.messages.push(`Resolution ${shortEdge}px on short edge. 512px minimum recommended.`); }
    const ratio = img.naturalWidth / img.naturalHeight;
    if (ratio > 3 || ratio < 0.33) { result.status = 'warn'; result.messages.push(`Extreme aspect ratio ${ratio.toFixed(2)}. May affect conditioning.`); }
  } catch (e) { /* skip */ }

  try {
    result.phash = await computePHash(imgUrl);
    if (result.phash) {
      for (const ref of existingRefs) {
        if (ref.phash && hammingDistance(result.phash, ref.phash) < 5) {
          result.isDuplicate = true; result.duplicateSlot = ref.slotName; result.status = 'block';
          result.messages.push(`Duplicate of existing slot "${ref.slotName}". This image has already been uploaded.`);
          break;
        }
      }
    }
    if (!result.isDuplicate) {
      const blur = await checkBlur(imgUrl);
      if (blur?.isBlurry) { if (result.status === 'pass') result.status = 'warn'; result.messages.push(blur.message); }
    }
  } catch (e) {
    for (const ref of existingRefs) {
      if (ref.imageUrl === imgUrl) {
        result.isDuplicate = true; result.duplicateSlot = ref.slotName; result.status = 'block';
        result.messages.push(`Duplicate of existing slot "${ref.slotName}". Same image already uploaded.`);
        break;
      }
    }
  }

  return result;
}