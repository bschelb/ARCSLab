'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './PdfReader.module.css';

type PdfJs = typeof import('pdfjs-dist');
type PdfPage = Awaited<ReturnType<Awaited<ReturnType<PdfJs['getDocument']>['promise']>['getPage']>>;

interface Item {
  wrap: HTMLDivElement;
  canvas: HTMLCanvasElement;
  text: HTMLDivElement;
  page: PdfPage;
  ptW: number;
  renderedW: number | null;
  visible: boolean;
  task?: { cancel: () => void; promise: Promise<unknown> };
  textLayer?: { cancel: () => void };
}

/**
 * Inline PDF reader on self-hosted PDF.js (public/pdfjs, copied from pdfjs-dist at build).
 * Pages render lazily to canvas at the current zoom and are released when far off-screen.
 * Each page carries a PDF.js text layer, so text is selectable and readable by screen
 * readers (the canvas is aria-hidden). A download link is always available.
 *
 * Canvas rendering is deliberate: it works even when the visitor's browser is set to
 * download PDFs instead of displaying them.
 */
/** `downloadIcon` is rendered by the server, so the icon table stays out of the client bundle. */
export default function PdfReader({
  url,
  title,
  downloadIcon,
}: {
  url: string;
  title: string;
  downloadIcon?: ReactNode;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const controls = useRef<{ zoom: (f: number) => void; fit: () => void } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [zoomPct, setZoomPct] = useState(100);

  useEffect(() => {
    const host = hostRef.current;
    const pagesEl = pagesRef.current;
    if (!host || !pagesEl) return;
    let cancelled = false;
    const items: Item[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let refW = (612 * 4) / 3; // a page's "actual size" CSS width (= 100%)
    let pageW = 700;
    let pdfjs: PdfJs | null = null;
    const contentW = () => host.clientWidth - 32;

    const renderItem = (it: Item) => {
      it.task?.cancel();
      it.textLayer?.cancel();
      const vp = it.page.getViewport({ scale: (pageW * dpr) / it.ptW });
      it.canvas.width = Math.round(vp.width);
      it.canvas.height = Math.round(vp.height);
      it.renderedW = pageW;
      const task = it.page.render({ canvas: it.canvas, viewport: vp });
      it.task = task;
      task.promise.catch(() => {});
      // Text layer at CSS scale, for selection and screen readers.
      if (pdfjs) {
        try {
          const cssScale = pageW / it.ptW;
          it.text.replaceChildren();
          it.text.style.setProperty('--total-scale-factor', String(cssScale));
          const layer = new pdfjs.TextLayer({
            textContentSource: it.page.streamTextContent(),
            container: it.text,
            viewport: it.page.getViewport({ scale: cssScale }),
          });
          it.textLayer = layer;
          layer.render().catch(() => {});
        } catch {
          /* text layer is an enhancement; the canvas and download link still work */
        }
      }
    };
    const releaseItem = (it: Item) => {
      if (it.renderedW == null) return;
      it.task?.cancel();
      it.textLayer?.cancel();
      it.canvas.width = 0;
      it.canvas.height = 0;
      it.text.replaceChildren();
      it.renderedW = null;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const it = items[Number((e.target as HTMLElement).dataset.i)];
          if (!it) continue;
          it.visible = e.isIntersecting;
          if (e.isIntersecting) {
            if (it.renderedW !== pageW) renderItem(it);
          } else releaseItem(it);
        }
      },
      { root: host, rootMargin: '700px 0px' },
    );
    const pageIo = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.i) + 1);
        }
      },
      { root: host, threshold: 0.5 },
    );

    const applyWidth = () => {
      for (const it of items) {
        it.wrap.style.width = `${Math.round(pageW)}px`;
        if (it.visible) renderItem(it);
        else releaseItem(it);
      }
      setZoomPct(Math.round((pageW / refW) * 100));
    };
    controls.current = {
      zoom: (f) => {
        pageW = Math.max(260, Math.min(pageW * f, contentW() * 3));
        applyWidth();
      },
      fit: () => {
        pageW = contentW();
        applyWidth();
      },
    };

    (async () => {
      try {
        // Loaded at runtime from /public, never bundled (see web/scripts/copy-pdfjs.mjs).
        const src = '/pdfjs/pdf.min.mjs';
        pdfjs = (await import(/* webpackIgnore: true */ src)) as PdfJs;
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        const first = await doc.getPage(1);
        refW = (first.getViewport({ scale: 1 }).width * 4) / 3;
        pageW = Math.min(refW * 0.7, contentW());
        for (let n = 1; n <= doc.numPages; n++) {
          const page = n === 1 ? first : await doc.getPage(n);
          if (cancelled) return;
          const { width: ptW, height: ptH } = page.getViewport({ scale: 1 });
          const wrap = document.createElement('div');
          wrap.className = styles.page ?? '';
          wrap.style.aspectRatio = `${ptW} / ${ptH}`;
          wrap.style.width = `${Math.round(pageW)}px`;
          wrap.dataset.i = String(n - 1);
          wrap.setAttribute('role', 'region');
          wrap.setAttribute('aria-label', `Page ${n} of ${doc.numPages}`);
          const canvas = document.createElement('canvas');
          canvas.width = 0;
          canvas.height = 0;
          canvas.className = styles.canvas ?? '';
          canvas.setAttribute('aria-hidden', 'true');
          const text = document.createElement('div');
          text.className = styles.textLayer ?? '';
          wrap.append(canvas, text);
          pagesEl.appendChild(wrap);
          items.push({ wrap, canvas, text, page, ptW, renderedW: null, visible: false });
          io.observe(wrap);
          pageIo.observe(wrap);
        }
        setPageCount(doc.numPages);
        setZoomPct(Math.round((pageW / refW) * 100));
        setState('ready');
      } catch (err) {
        console.error('PDF render failed:', err);
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
      io.disconnect();
      pageIo.disconnect();
      items.forEach(releaseItem);
      pagesEl.replaceChildren();
    };
  }, [url]);

  return (
    <div className={styles.reader}>
      <div className={styles.bar} role="toolbar" aria-label="PDF reader controls">
        <div className={styles.group}>
          <span className={styles.count} aria-live="polite">
            {state === 'ready'
              ? `Page ${current} of ${pageCount}`
              : state === 'error'
                ? 'Unavailable'
                : 'Loading…'}
          </span>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={state !== 'ready'}
            onClick={() => controls.current?.zoom(1 / 1.2)}
          >
            −
          </button>
          <span className={styles.zoom} aria-label={`Zoom ${zoomPct}%`}>
            {zoomPct}%
          </span>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={state !== 'ready'}
            onClick={() => controls.current?.zoom(1.2)}
          >
            +
          </button>
          <button
            type="button"
            className={styles.fit}
            disabled={state !== 'ready'}
            onClick={() => controls.current?.fit()}
          >
            Fit width
          </button>
        </div>
        <div className={styles.group}>
          <a href={url} target="_blank" rel="noopener">
            Open in new tab <span aria-hidden="true">↗</span>
          </a>
          <a href={url} download>
            {downloadIcon} Download
          </a>
        </div>
      </div>
      <div ref={hostRef} className={styles.host} tabIndex={0} aria-label={`PDF of ${title}`}>
        <div ref={pagesRef} className={styles.pages} />
        {state === 'loading' && (
          <p className={styles.status} role="status">
            Loading PDF…
          </p>
        )}
        {state === 'error' && (
          <p className={styles.fallback}>
            Couldn&apos;t render the PDF inline.{' '}
            <a href={url} target="_blank" rel="noopener">
              Open it in a new tab
            </a>{' '}
            or{' '}
            <a href={url} download>
              download it
            </a>
            .
          </p>
        )}
      </div>
      <p className={styles.always}>
        Prefer a file?{' '}
        <a href={url} download>
          Download the PDF
        </a>
      </p>
    </div>
  );
}
