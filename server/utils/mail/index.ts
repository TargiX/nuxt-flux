import { resendMailer } from './ResendMailer'
import type { Mailer } from './mailer'

// For now, we are defaulting to the Resend mailer.
// This could be extended with a factory pattern if more mailers are added later.
export const mailer: Mailer = resendMailer
