export interface Mailer {
  sendPasswordResetEmail(to: string, link: string): Promise<void>
}
