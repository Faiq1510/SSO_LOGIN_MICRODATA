import nodemailer from "nodemailer";

interface MailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: {
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }[];
}

export const sendMail = async (options: MailOptions) => {
  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;

  if (!mailUser || !mailPass) {
    console.warn("Mail service is not fully configured.");
    return null;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: mailUser,
      pass: mailPass,
    },
  });

  try {
    return await transporter.sendMail({
      from: mailUser,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
  } catch (error) {
    throw error;
  }
};
