import fs from 'node:fs/promises';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createServer } from 'vite';

const sourceDirectory = process.argv[2];
if (!sourceDirectory) throw new Error('请提供年报目录');

const names = (await fs.readdir(sourceDirectory)).filter((name) => name.toLowerCase().endsWith('.pdf')).sort();
const cMapUrl = path.resolve('node_modules/pdfjs-dist/cmaps') + path.sep;
const standardFontDataUrl = path.resolve('node_modules/pdfjs-dist/standard_fonts') + path.sep;
const results = [];
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
const { analyzeMaterial } = await vite.ssrLoadModule('/src/lib/risk-analysis.ts');

function normalizeExtractedText(value) {
  let text = value.replace(/[\t\f\v]+/g, ' ').replace(/ {2,}/g, ' ');
  for (let index = 0; index < 3; index += 1) text = text.replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1');
  return text.trim();
}

for (const name of names) {
  const sourcePath = path.join(sourceDirectory, name);
  const data = new Uint8Array(await fs.readFile(sourcePath));
  const loadingTask = pdfjs.getDocument({ data, cMapUrl, cMapPacked: true, standardFontDataUrl, useSystemFonts: true });
  const document = await loadingTask.promise;
  const pageCount = document.numPages;
  let characters = 0;
  let chineseCharacters = 0;
  let nonEmptyPages = 0;
  let text = '';
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = normalizeExtractedText(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
    if (pageText.length) nonEmptyPages += 1;
    characters += pageText.length;
    chineseCharacters += (pageText.match(/[\u3400-\u9fff]/g) || []).length;
    text += `\n[PAGE:${pageNumber}]\n${pageText}`;
    page.cleanup();
  }
  await loadingTask.destroy();
  const company = name.split('_')[0];
  const analysis = analyzeMaterial({ text, channel: 'A', parserStatus: '自动化验证', company });
  results.push({
    company,
    file: name,
    pages: pageCount,
    nonEmptyPages,
    characters,
    chineseRatio: characters ? Number((chineseCharacters / characters).toFixed(3)) : 0,
    companyNamed: text.includes(company),
    materialRelevance: analysis.materialRelevance,
    findings: analysis.findings.map((finding) => ({
      riskDomain: finding.riskDomain,
      status: finding.status,
      evidenceCount: finding.evidenceItems.length,
      firstPage: finding.evidenceItems[0]?.page ?? null,
      firstExcerpt: finding.evidenceItems[0]?.excerpt.slice(0, 100) || '',
    })),
    signals: {
      r1: ['算法', '模型', '芯片', '算力', '研发'].filter((word) => text.includes(word)),
      r2: ['数据安全', '个人信息', '隐私', '数据出境'].filter((word) => text.includes(word)),
      r3: ['知识产权', '专利', '著作权', '开源'].filter((word) => text.includes(word)),
      r4: ['应收账款', '经营现金流', '客户集中', '持续亏损'].filter((word) => text.includes(word)),
      r5: ['供应商', '出口管制', '实体清单', '核心人员'].filter((word) => text.includes(word)),
    },
  });
}

await vite.close();
const output = process.env.ZHIXIAN_VALIDATION_SUMMARY === '1'
  ? results.map(({ company, pages, characters, chineseRatio, materialRelevance, findings }) => ({
      company, pages, characters, chineseRatio, materialRelevance,
      findings: findings.map(({ riskDomain, status, evidenceCount, firstPage }) => ({ riskDomain, status, evidenceCount, firstPage })),
    }))
  : results;
console.log(JSON.stringify(output, null, 2));
