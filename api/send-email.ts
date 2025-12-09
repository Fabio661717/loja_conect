import type { Request, Response } from "express";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req: Request, res: Response) {
  const { to, subject, text } = req.body as {
    to: string;
    subject: string;
    text: string;
  };

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido";
    res.status(500).json({ success: false, error: errorMessage });
  }
}
