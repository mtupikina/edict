/** Fields required to render the check-words printable table (verify list or quiz row). */
export interface CheckWordsPrintRow {
  word: string;
  translation?: string;
  examples?: string[];
}

export function checkWordsHasPrintableRows(
  quizWords: readonly unknown[],
  toVerifyList: readonly unknown[],
): boolean {
  return quizWords.length > 0 || toVerifyList.length > 0;
}

/**
 * Opens a printable view of the words currently shown (same data as
 * `GET …/words/verify/list` or `POST …/words/verify/generate` — no extra fetch).
 */
export function openCheckWordsPrintWindow(
  quizWords: readonly CheckWordsPrintRow[],
  toVerifyList: readonly CheckWordsPrintRow[],
): void {
  const useQuiz = quizWords.length > 0;
  const list = useQuiz ? quizWords : toVerifyList;
  if (list.length === 0) {
    return;
  }

  const title = useQuiz ? 'Generated quiz' : 'Words to verify';
  const esc = (s: string): string => {
    const el = document.createElement('div');
    el.textContent = s;
    return el.innerHTML;
  };

  const examplesCell = (examples: string[] | undefined): string => {
    if (!examples?.length) {
      return '—';
    }
    return `<ul class="examples">${examples
      .map((ex) => `<li>${esc(ex)}</li>`)
      .join('')}</ul>`;
  };

  const rows = list
    .map(
      (w, i) => `<tr>
        <td>${i + 1}</td>
        <td>${esc(w.word)}</td>
        <td>${w.translation ? esc(w.translation) : '—'}</td>
        <td>${examplesCell(w.examples)}</td>
      </tr>`,
    )
    .join('');

  // Do not pass `noopener` here: browsers then return `null` from `window.open`
  // while still opening a tab, so we never get a handle to `document.write`.
  const win = window.open('', '_blank');
  if (!win) {
    return;
  }

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Check words — ${esc(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1rem; color: #0f172a; }
    h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
    p.sub { font-size: 0.875rem; color: #64748b; margin: 0 0 1rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { border: 1px solid #cbd5e1; padding: 0.4rem 0.5rem; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-weight: 600; }
    ul.examples { margin: 0; padding-left: 1.1rem; }
    ul.examples li { margin: 0.15rem 0; }
    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>
  <h1>Check words — ${esc(title)}</h1>
  <p class="sub">Printed ${esc(new Date().toLocaleString())}</p>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Word</th>
        <th>Translation</th>
        <th>Examples</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`);
  doc.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 0);
}
