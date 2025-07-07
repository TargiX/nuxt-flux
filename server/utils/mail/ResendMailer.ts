import { Resend } from 'resend'
import type { Mailer } from './mailer'

const runtimeConfig = useRuntimeConfig()

export const resendMailer: Mailer = {
  async sendPasswordResetEmail(to: string, link: string) {
    const resendApiKey = runtimeConfig.resend?.apiKey as string | undefined

    if (!resendApiKey) {
      console.error(
        '[Resend Mailer] Cannot send email: RESEND_API_KEY is not configured in runtimeConfig.'
      )
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Resend Mailer] Fallback: Password reset link for ${to} is ${link}`)
        return
      }
      throw new Error('Email service is not configured.')
    }

    const resend = new Resend(resendApiKey)

    try {
      await resend.emails.send({
        from: 'no-reply@dreamseed.co', // This must be a verified domain on Resend
        to,
        subject: 'Reset Your Password for Dreamseed',
        html: `<p>Hello,</p><p>Please click the following link to reset your password. This link is valid for 15 minutes.</p><p><a href="${link}">${link}</a></p><p>If you did not request a password reset, please ignore this email.</p>`,
      })
      console.log(`[Resend Mailer] Password reset email successfully sent to ${to}`)
    } catch (error) {
      console.error(`[Resend Mailer] Failed to send email to ${to}:`, error)
      throw new Error('Failed to send password reset email.')
    }
  },
}
