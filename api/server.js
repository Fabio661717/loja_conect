import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carrega variáveis PRIVADAS do .env.local
dotenv.config({ path: '.env.local' })

const app = express()
app.use(cors())
app.use(express.json())

// Cliente ADMIN com SERVICE_ROLE_KEY (backend apenas)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// API para operações administrativas
app.post('/api/admin/users', async (req, res) => {
  try {
    const { userId, role } = req.body

    // ⚠️ Esta operação ignora RLS (apenas no backend)
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { user_metadata: { role } }
    )

    if (error) throw error
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API para enviar emails
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, html } = req.body

    // Usa credenciais SMTP do .env.local
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Webhook do Stripe (usa secret do backend)
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Processa o evento
  handleStripeEvent(event)

  res.json({ received: true })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`)
})
