// Print rules shared by every place that prints a CV (the print page, which is also what
// the server-side PDF renders). One source so the browser preview and the PDF can't drift.
//
// Page margins: templates carry their own top padding (and Europass a full-bleed header),
// so page 1 has no top page-margin. Every later page gets a top margin, and every page a
// bottom one — otherwise content on pages 2+ starts glued to the paper edge.
export const CV_PRINT_CSS = `
  @media print {
    @page { size: A4 portrait; margin: 14mm 0; }
    @page :first { margin-top: 0; }
    html, body { margin: 0; background: #ffffff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cv-container { background: #ffffff !important; box-shadow: none !important; }
    .no-print { display: none !important; }
  }
`
