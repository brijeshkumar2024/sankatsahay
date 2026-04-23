import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    : undefined
});

export async function sendEmailAlert(to, subject, text) {
  if (!process.env.SMTP_USER) {
    return { mocked: true, to, subject, text };
  }

  return transporter.sendMail({
    from: `SankatSahay <${process.env.SMTP_USER}>`,
    to,
    subject,
    text
  });
}
