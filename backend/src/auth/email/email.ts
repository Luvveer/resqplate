import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

async function sendEmail(input: SendEmailInput): Promise<void> {
  const { error } = await resend.emails.send({
    from: "ResQPlate <no-reply@resqplate.me>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#039;";
      default:
        return char;
    }
  });
}

function createResetPassword(url: string): {
  html: string;
  text: string;
} {
  const safeUrl = escapeHtml(url);
  const text = `
  Reset your ResQPlate account password

  We received a request to reset passowrd for your ResQPlate account.

  Reset your password using this link:
  ${url}

  This password reset link expires in 1 hour.

  If you did not request a password change, someone may have tried to access your account. Do not use this link. Your password has not been changed, and we recommend changing your password directly from your ResQPlate account.

  - The ResQPlate Team
  `.trim();

  const html = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>Reset your ResQPlate password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ece5d6; font-family: Arial, Helvetica, sans-serif; color: #211e18;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">Use this secure link to reset your ResQPlate account password.</div>
    <table 
        role="presentation" 
        width="100%"
        cellpadding="0"
        cellspacing="0"
        style="background-color: #ece5d6;"
    >
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table
                    role="presentation" 
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="width: 100%; max-width: 600px; background-color: #fbf8f1; border: 1px solid #dcd3bf; border-radius: 13px; overflow: hidden;"
                >
                    <tr>
                        <td style="padding: 24px 33px; background-color: #211e18;">
                            <p style="margin: 0; color: #fbf8f1; font-size: 24px; line-height: 32px; font-weight: 700;">
                                ResQPlate
                            </p>
                            <p style="margin: 4px 0 0; color: #a79c86; font-size: 14px; line-height: 20px;">
                                Connecting surplus food with community
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 36px 32px;">
                            <h1 style="margin: 0 0 16px; color: #211e18; font-size: 26px; line-height: 34px;">
                                Reset your password
                            </h1>
                            <p style="margin: 0 0 16px; color: #786f5c; font-size: 16px; line-height: 25px;">
                                We received a request to reset password for your ResQPlate account.
                            </p>
                            <p style="margin: 0 0 28px; color: #786f5c; font-size: 16px; line-height: 25px;">
                                Click the button below to choose a new password.
                            </p>
                            <table 
                                role="presentation"
                                cellpadding="0"
                                cellspacing="0"
                                border="0"
                            >
                                <tr>
                                    <td align="center" style="background-color: #e39a16; border-radius: 8px;">
                                        <a 
                                            href="${safeUrl}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style="display: inline-block; padding: 13px 22px; color: #211e18; font-size: 16px; line-height: 22px; font-weight: 700; text-decoration: none;"
                                        >
                                            Reset my password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin: 28px 0 0; padding: 14px 16px; background-color: #ece5d6; border-left: 4px solid #e39a16; border-radius: 7px;">
                                <p style="margin: 0; color: #453524; font-size: 14px; line-height: 21px;">
                                    For your security, this link expires in <strong>1 hour</strong>.
                                </p>
                            </div>

                            <p style="margin: 28px 0 0; color: #786f5c; font-size: 12px; line-height: 20px;">
                                If button does not work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0; font-size: 12px; line-height: 20px; word-break: break-all;">
                                <a 
                                    href="${safeUrl}"
                                    style="color: #453524; text-decoration: underline;"
                                >${safeUrl}</a>
                            </p>

                            <hr style="margin: 32px 0; border: 0; border-top: 1px solid #dcd3bf;">
                            <p style="margin: 0; color: #786f5c; font-size: 14px; line-height: 22px;">
                                If you did not request a password change, someone may have tried to access your account. Do not use this link. Your password has not been changed, and we recommend changing your password directly from your ResQPlate account.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 32px; background-color: #ece5d6; border-top: 1px solid #dcd3bf;">
                            <p style="margin: 0; color: #786f5c; font-size: 12px; line-height: 18px; text-align: center;">
                                This is an automated security email from ResQPlate. Please do not reply.
                            </p>
                            <p style="margin: 6px 0 0; color: #a79c86; font-size: 12px; line-height: 18px; text-align: center;">
                                &copy; ${new Date().getFullYear()} ResQPlate
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `.trim();

  return { html, text };
}

export async function sendResetPasswordEmail(
  to: string,
  url: string,
): Promise<void> {
  const email = createResetPassword(url);
  await sendEmail({
    to,
    subject: "Reset your ResQPlate password",
    html: email.html,
    text: email.text,
  });
}
