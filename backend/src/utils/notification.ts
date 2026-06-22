import nodemailer from 'nodemailer';

// Konfigurasi transporter untuk Email (Dinamis untuk SMTP Perusahaan)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true untuk port 465, false untuk TLS 587
  auth: {
    user: process.env.SMTP_EMAIL || '',
    pass: process.env.SMTP_PASSWORD || ''
  }
});

/**
 * Mengirimkan Notifikasi Email
 */
export const sendEmailNotification = async (to: string, subject: string, html: string) => {
  // Jika environment variable tidak di-set, kita simulasikan di console log
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log(`[SIMULASI EMAIL] Ke: ${to} | Subjek: ${subject}`);
    console.log(`Isi Pesan: ${html.replace(/<[^>]*>?/gm, '')}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Sistem GACT Transport" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log(`Berhasil mengirim email ke ${to}`);
  } catch (error) {
    console.error('Gagal mengirim email:', error);
  }
};

/**
 * Mengirimkan Notifikasi WhatsApp menggunakan Fonnte API (Contoh)
 * Anda bisa menggantinya dengan provider WhatsApp Gateway pilihan Anda (seperti Wablas, Twilio, dll).
 */
export const sendWhatsAppMessage = async (targetNumber: string, message: string) => {
  const token = process.env.WHATSAPP_TOKEN;
  
  if (!token) {
    console.log(`[SIMULASI WHATSAPP] Ke: ${targetNumber}`);
    console.log(`Isi Pesan: ${message}`);
    return;
  }

  try {
    console.log(`[WA] Mulai mengirim pesan ke ${targetNumber}...`);
    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: targetNumber,
        message: message,
        countryCode: '62', // Default Indonesia
      })
    });
    
    const result = await response.json();
    if (result.status) {
      console.log(`Berhasil mengirim WA ke ${targetNumber}`);
    } else {
      console.error('Gagal mengirim WA (API Response):', result);
    }
  } catch (error) {
    console.error('Gagal memanggil API WhatsApp:', error);
  }
};
