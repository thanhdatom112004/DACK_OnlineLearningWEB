const nodemailer = require("nodemailer");

function getSmtpOptions() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 25),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };
}

async function sendMail(to, url) {
  // If SMTP not configured, fail fast (so user knows what to set in .env)
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP is not configured. Please set SMTP_HOST/SMTP_USER/SMTP_PASS in .env.");
  }

  const transporter = nodemailer.createTransport(getSmtpOptions());

  const from = process.env.SMTP_FROM || "admin@heha.com";

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Reset Password email",
    text: "click vao day de reset password",
    html: 'click vao <a href="' + url + '">day</a> de reset password',
  });

  return info;
}

module.exports = { sendMail };

