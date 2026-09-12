import pdfWorkerSource from 'pdfjs-dist/legacy/build/pdf.worker.mjs?raw';

let workerUrl = '';

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
  const task = pdfjs.getDocument({ data });
  const pdf = await task.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 250); pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
    pages.push(`[PAGE:${pageNumber}]\n${pageText}`);
  }

  await task.destroy();
  return pages.join('\n');
}
