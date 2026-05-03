import QRCode from 'qrcode';

/**
 * Generates a QR code as a base64 data URL pointing to the verification page.
 */
export async function generateShareQR(shareToken, clientUrl) {
  const verifyUrl = `${clientUrl}/verify/${shareToken}`;
  const qr = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#6366f1', light: '#0f1629' },
    errorCorrectionLevel: 'M',
  });
  return qr; // base64 PNG data URL
}
