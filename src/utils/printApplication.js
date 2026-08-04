const PRINT_FRAME_ID = 'jntugv-application-print-frame';

export const printApplication = () => {
  const source = document.querySelector('.printable-application');
  if (!source) {
    throw new Error('Application print sheet is not available. Please reopen the application and try again.');
  }

  document.getElementById(PRINT_FRAME_ID)?.remove();

  const frame = document.createElement('iframe');
  frame.id = PRINT_FRAME_ID;
  frame.title = 'Application print sheet';
  frame.setAttribute('aria-hidden', 'true');
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '1px',
    height: '1px',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(frame);

  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')]
    .map(node => node.outerHTML)
    .join('\n');
  const printDocument = frame.contentDocument;
  printDocument.open();
  printDocument.write(`<!doctype html>
    <html>
      <head>
        <base href="${document.baseURI}">
        <meta charset="UTF-8">
        <title>JNTUGV Application</title>
        ${styles}
        <style>
          html, body { width: auto !important; min-height: 0 !important; margin: 0 !important; background: #fff !important; }
          body * { visibility: visible !important; }
          .printable-application { position: static !important; width: 100% !important; }
        </style>
      </head>
      <body>${source.outerHTML}</body>
    </html>`);
  printDocument.close();

  const cleanup = () => window.setTimeout(() => frame.remove(), 500);
  const launchPrint = async () => {
    try {
      await printDocument.fonts?.ready;
      await Promise.all([...printDocument.images].map(image => (
        image.complete ? Promise.resolve() : new Promise(resolve => {
          image.addEventListener('load', resolve, { once: true });
          image.addEventListener('error', resolve, { once: true });
        })
      )));
      frame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
      frame.contentWindow.focus();
      frame.contentWindow.print();
      window.setTimeout(cleanup, 60_000);
    } catch (error) {
      frame.remove();
      throw error;
    }
  };

  window.setTimeout(launchPrint, 100);
};
