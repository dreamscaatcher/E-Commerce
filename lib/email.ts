import nodemailer from "nodemailer";

type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const portRaw = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;
  const secureRaw = process.env.SMTP_SECURE;

  const port = portRaw ? Number(portRaw) : NaN;
  const secure = secureRaw ? secureRaw === "true" : port === 465;

  if (!host || !portRaw || !Number.isFinite(port) || !user || !pass || !from) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

export function isSmtpConfigured() {
  return Boolean(getSmtpConfig());
}

let cachedTransport: nodemailer.Transporter | null = null;
let cachedFrom: string | null = null;

export async function sendEmail(message: EmailMessage) {
  const config = getSmtpConfig();
  if (!config) {
    const emailVerificationDisabled =
      process.env.DISABLE_EMAIL_VERIFICATION === "true";

    if (process.env.NODE_ENV !== "production" || emailVerificationDisabled) {
      console.log("[email] SMTP not configured. Email contents:");
      console.log(message.text);
      return;
    }
    throw new Error(
      "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
  }

  if (!cachedTransport || cachedFrom !== config.from) {
    cachedTransport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    cachedFrom = config.from;
  }

  await cachedTransport.sendMail({
    from: config.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
