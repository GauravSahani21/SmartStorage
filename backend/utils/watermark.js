import { PDFDocument, rgb, degrees } from 'pdf-lib';
import sharp from 'sharp';

/**
 * Adds a diagonal watermark to a PDF buffer.
 * @param {Buffer} pdfBuffer
 * @param {string} watermarkText
 * @returns {Promise<Buffer>} watermarked PDF buffer
 */
export async function watermarkPDF(pdfBuffer, watermarkText) {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(watermarkText, {
      x: width / 2 - 150,
      y: height / 2 - 20,
      size: 36,
      color: rgb(0.4, 0.4, 0.4),
      opacity: 0.25,
      rotate: degrees(45),
    });
  }

  const watermarkedBytes = await pdfDoc.save();
  return Buffer.from(watermarkedBytes);
}

/**
 * Adds a watermark text overlay to an image buffer.
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 * @param {string} watermarkText
 * @returns {Promise<Buffer>} watermarked image buffer
 */
export async function watermarkImage(imageBuffer, mimeType, watermarkText) {
  const image = sharp(imageBuffer);
  const meta = await image.metadata();
  const { width = 800, height = 600 } = meta;

  const svgWidth = Math.min(width * 0.8, 600);
  const fontSize = Math.max(20, Math.floor(svgWidth / 15));

  const svgText = `
    <svg width="${svgWidth}" height="${fontSize * 2}" xmlns="http://www.w3.org/2000/svg">
      <text
        x="50%" y="60%"
        font-family="Arial" font-size="${fontSize}"
        fill="rgba(100,100,100,0.45)"
        text-anchor="middle"
        dominant-baseline="middle"
        transform="rotate(-35, ${svgWidth / 2}, ${fontSize})"
      >${watermarkText}</text>
    </svg>`;

  const svgBuffer = Buffer.from(svgText);

  return await sharp(imageBuffer)
    .composite([{
      input: svgBuffer,
      top: Math.floor(height / 2 - fontSize),
      left: Math.floor(width / 2 - svgWidth / 2),
    }])
    .toBuffer();
}
