'use client';

import { useState } from 'react';
import styles from './CopyCitation.module.css';

/** Citation in BibTeX or APA, with a copy button (falls back to selecting the text). */
export default function CopyCitation({ bibtex, apa }: { bibtex: string; apa: string }) {
  const [format, setFormat] = useState<'bibtex' | 'apa'>('bibtex');
  const [status, setStatus] = useState('');
  const text = format === 'bibtex' ? bibtex : apa;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${format === 'bibtex' ? 'BibTeX' : 'APA'} citation copied`);
    } catch {
      const pre = document.getElementById('citation-text');
      if (pre) window.getSelection()?.selectAllChildren(pre);
      setStatus('Citation selected — press Ctrl+C or ⌘C to copy');
    }
    window.setTimeout(() => setStatus(''), 2400);
  };

  return (
    <div className={styles.wrap} id="cite">
      <div className={styles.bar}>
        <div role="group" aria-label="Citation format" className={styles.formats}>
          {(['bibtex', 'apa'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)}>
              {f === 'bibtex' ? 'BibTeX' : 'APA'}
            </button>
          ))}
        </div>
        <button type="button" className={styles.copy} onClick={copy}>
          Copy citation
        </button>
      </div>
      {/* Long BibTeX lines scroll sideways; focusable so keyboard users can scroll it (axe). */}
      <pre
        id="citation-text"
        tabIndex={0}
        role="region"
        aria-label={`${format === 'bibtex' ? 'BibTeX' : 'APA'} citation`}
        className={format === 'apa' ? `${styles.text} ${styles.apa}` : styles.text}
      >
        {text}
      </pre>
      <p className={styles.status} aria-live="polite">
        {status}
      </p>
    </div>
  );
}
