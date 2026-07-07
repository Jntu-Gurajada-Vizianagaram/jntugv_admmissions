const filenameSafe = (value) => (
  String(value || 'application')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'application'
)

export const downloadApplicationPdf = async (registrationNo = '') => {
  const element = document.getElementById('printable-application')
  if (!element) {
    throw new Error('Application preview is not available for PDF download.')
  }

  const [{ jsPDF }, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])
  const html2canvas = html2canvasModule.default

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 3,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, pageWidth, pageHeight)

  pdf.save(`${filenameSafe(registrationNo || 'JNTUGV-IIBMP-Application')}.pdf`)
}
