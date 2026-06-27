import resend from "../lib/email.js";
import { welcomeTemplate } from "../lib/emailTemplates.js";

async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html,
  });
  if (error) console.error("Email error:", error);
  return data;
}

export async function sendWelcomeEmail(user) {
  const template = welcomeTemplate(user);
  return sendEmail({ to: user.email, ...template });
}

export async function sendVerificationEmail(user, token) {
  const template = verificationTemplate(user, token);
  return sendEmail({ to: user.email, ...template });
}

export async function sendPasswordResetEmail(user, token) {
  const template = resetPasswordTemplate(user, token);
  return sendEmail({ to: user.email, ...template });
}
