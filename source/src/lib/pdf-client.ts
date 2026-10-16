import pdfWorkerSource from 'pdfjs-dist/legacy/build/pdf.worker.mjs?raw';

let workerUrl = '';

function normalizeExtractedText(value: string) {
  let text = value.replace(/[\t\f\v]+/g, ' ').replace(/ {2,}/g, ' ');
  // 部分港股年报会把每个汉字作为独立字形返回。合并汉字间空格，避免关键词漏检。
  for (let index = 0; index < 3; index += 1) {
    text = text.replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1');
  }
  return text.trim();
}

function getWorkerUrl() {
  if (!workerUrl) {
    workerUrl = URL.createObjectURL(new Blob([pdfWorkerSource], { type: 'text/javascript' }));
  }
  return workerUrl;
}

export async function extractPdfText(data: Uint8Array) {
  if (typeof window === 'undefined') {
    throw new Error('PDF解析仅能在浏览器中运行。');
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = getWorkerUrl();
  const publicBase = new URL(import.meta.env.BASE_URL, window.location.href);
  const task = pdfjs.getDocument({
    data,
    cMapUrl: new URL('pdfjs/cmaps/', publicBase).href,
    cMapPacked: true,
    standardFontDataUrl: new URL('pdfjs/standard_fonts/', publicBase).href,
    useSystemFonts: true,
  });
  const pdf = await task.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = normalizeExtractedText(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    pages.push(`[PAGE:${pageNumber}]\n${pageText}`);
    page.cleanup();
  }

  await task.destroy();
  return pages.join('\n');
}
