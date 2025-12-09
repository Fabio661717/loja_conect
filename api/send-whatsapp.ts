import type { Request, Response } from "express";
import twilio from "twilio";

const client = twilio(process.env.TWILIO_SID!, process.env.TWILIO_TOKEN!);

export default async function handler(req: Request, res: Response) {
  const { to, message } = req.body;

  try {
    await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });

    res.status(200).json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      res.status(500).json({ success: false, error: err.message });
    } else {
      res.status(500).json({ success: false, error: "Erro desconhecido" });
    }
  }
}
