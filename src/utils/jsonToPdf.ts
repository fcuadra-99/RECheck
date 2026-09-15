import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';

const LINE_HEIGHT = 7;
const FONT_SIZE = 10;

const formatLabel = (key: string): string => {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
};

const flattenObject = (obj: unknown, prefix = '', out: Array<{ label: string; value: string }> = []): Array<{ label: string; value: string }> => {
  if (obj === null || obj === undefined) {
    if (prefix) out.push({ label: formatLabel(prefix), value: '' });
    return out;
  }

  if (Array.isArray(obj)) {
    if (!obj.length) {
      if (prefix) out.push({ label: formatLabel(prefix), value: '' });
      return out;
    }

    const hasComplex = obj.some((item) => typeof item === 'object' && item !== null);
    if (!hasComplex) {
      out.push({ label: formatLabel(prefix), value: obj.map((v) => String(v ?? '')).join(', ') });
      return out;
    }

    obj.forEach((item, idx) => {
      flattenObject(item, `${prefix} ${idx + 1}`, out);
    });
    return out;
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (!entries.length && prefix) {
      out.push({ label: formatLabel(prefix), value: '' });
      return out;
    }

    entries.forEach(([key, value]) => {
      if (key === 'form') return;
      const nextPrefix = prefix ? `${prefix} ${key}` : key;
      flattenObject(value, nextPrefix, out);
    });
    return out;
  }

  out.push({ label: formatLabel(prefix), value: String(obj) });
  return out;
};

export const downloadJsonAsPdf = (jsonData: Record<string, any>, outputFileName: string, title: string) => {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const textWidth = pageWidth - margin * 2;

  let y = margin;

  const ensureSpace = (required = LINE_HEIGHT) => {
    if (y + required > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  const titleLines = pdf.splitTextToSize(title, textWidth);
  titleLines.forEach((line: string) => {
    ensureSpace(8);
    pdf.text(line, margin, y);
    y += 8;
  });

  y += 2;

  const rows = flattenObject(jsonData);
  pdf.setFontSize(FONT_SIZE);

  rows.forEach((row) => {
    const label = `${row.label}:`;
    const value = row.value || '-';

    pdf.setFont('helvetica', 'bold');
    const labelLines = pdf.splitTextToSize(label, textWidth);
    labelLines.forEach((line: string) => {
      ensureSpace();
      pdf.text(line, margin, y);
      y += LINE_HEIGHT;
    });

    pdf.setFont('helvetica', 'normal');
    const valueLines = pdf.splitTextToSize(value, textWidth);
    valueLines.forEach((line: string) => {
      ensureSpace();
      pdf.text(line, margin, y);
      y += LINE_HEIGHT;
    });

    y += 1;
  });

  pdf.save(outputFileName.toLowerCase().endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`);
};

type DownloadFormDesignParams = {
  form: ReactElement;
  outputFileName: string;
  renderWidthPx?: number;
};

const replaceOklchWithRgb = (cssText: string, doc: Document): string => {
  const colorPattern = /oklch\([^()]*\)/gi;

  return cssText.replace(colorPattern, (oklchValue) => {
    const probe = doc.createElement('span');
    probe.style.color = oklchValue;
    doc.body.appendChild(probe);
    const rgb = doc.defaultView?.getComputedStyle(probe).color;
    probe.remove();

    return rgb && rgb !== oklchValue ? rgb : 'rgb(0, 0, 0)';
  });
};

const captureFormCanvas = async (host: HTMLDivElement) => {
  try {
    return await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: host.scrollWidth,
      windowHeight: host.scrollHeight,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.toLowerCase().includes('unsupported color function "oklch"')) {
      throw error;
    }

    // Retry with color-function sanitization for environments where html2canvas cannot parse OKLCH.
    return await html2canvas(host, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      windowWidth: host.scrollWidth,
      windowHeight: host.scrollHeight,
      onclone: (clonedDoc) => {
        const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
        styleTags.forEach((tag) => {
          if (!tag.textContent || !tag.textContent.toLowerCase().includes('oklch(')) {
            return;
          }
          tag.textContent = replaceOklchWithRgb(tag.textContent, clonedDoc);
        });

        const inlineStyledNodes = Array.from(clonedDoc.querySelectorAll<HTMLElement>('[style]'));
        inlineStyledNodes.forEach((node) => {
          const styleText = node.getAttribute('style');
          if (!styleText || !styleText.toLowerCase().includes('oklch(')) {
            return;
          }
          node.setAttribute('style', replaceOklchWithRgb(styleText, clonedDoc));
        });
      },
    });
  }
};

export const downloadFormDesignAsPdf = async ({
  form,
  outputFileName,
  renderWidthPx = 1200,
}: DownloadFormDesignParams) => {
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.left = '-100000px';
  host.style.top = '0';
  host.style.width = `${renderWidthPx}px`;
  host.style.background = '#ffffff';
  host.style.padding = '0';
  host.style.margin = '0';
  host.style.zIndex = '-1';

  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    root.render(form);

    // Wait for layout and paint so html2canvas captures final styles.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

    const canvas = await captureFormCanvas(host);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidthMm = pdf.internal.pageSize.getWidth();
    const pageHeightMm = pdf.internal.pageSize.getHeight();
    const marginMm = 8;
    const printableWidthMm = pageWidthMm - marginMm * 2;
    const printableHeightMm = pageHeightMm - marginMm * 2;

    const pxPerMm = canvas.width / printableWidthMm;
    const pageHeightPx = Math.floor(printableHeightMm * pxPerMm);

    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;

      const ctx = pageCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Unable to create PDF canvas context.');
      }

      ctx.drawImage(
        canvas,
        0,
        offsetY,
        canvas.width,
        sliceHeight,
        0,
        0,
        canvas.width,
        sliceHeight,
      );

      const imgData = pageCanvas.toDataURL('image/png');
      const sliceHeightMm = sliceHeight / pxPerMm;

      if (pageIndex > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'PNG', marginMm, marginMm, printableWidthMm, sliceHeightMm, undefined, 'FAST');

      offsetY += sliceHeight;
      pageIndex += 1;
    }

    const fileName = outputFileName.toLowerCase().endsWith('.pdf') ? outputFileName : `${outputFileName}.pdf`;
    pdf.save(fileName);
  } finally {
    root.unmount();
    host.remove();
  }
};
