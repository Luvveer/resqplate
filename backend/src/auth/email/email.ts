import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(input: { to: string; subject: string; html: string }) {
  await resend.emails.send({
    from: "no-reply@resqplate.me",
    to: input.to,
    subject: input.subject,
    html: input.html,
  });
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await sendEmail({
    to,
    subject: "Reset your Resqplate password",
    html: `<p>Click below to reset your password. This link expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`,
  });
}
