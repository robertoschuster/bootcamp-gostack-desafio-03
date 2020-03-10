export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  default: {
    from: 'Equipe FastFeet <noreply@fastfeet.com.br>',
  },
};

/**
 * Serviços de Envio de email
 *
 * Amazon SES
 * Mailgun
 * Sparkpost
 * Mandril (para mailchimp)
 *
 * Mailtrap (somente em desenvolvimento)
 *
 */
