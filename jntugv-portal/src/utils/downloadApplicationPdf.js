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
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const contentWidth = pageWidth - (margin * 2)
  const contentHeight = pageHeight - (margin * 2)
  const pxPerMm = canvas.width / contentWidth
  const pageCanvasHeight = Math.floor(contentHeight * pxPerMm)
  let renderedHeight = 0

  while (renderedHeight < canvas.height) {
    const sliceHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight)
    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeight

    const context = pageCanvas.getContext('2d')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
    context.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    )

    if (renderedHeight > 0) {
      pdf.addPage()
    }

    const imageHeight = sliceHeight / pxPerMm
    pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, margin, contentWidth, imageHeight)
    renderedHeight += sliceHeight
  }

  pdf.save(`${filenameSafe(registrationNo || 'JNTUGV-IIBMP-Application')}.pdf`)
}
