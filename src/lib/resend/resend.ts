import * as brevo from '@getbrevo/brevo';

let brevoInstance: brevo.TransactionalEmailsApi | null = null;

export function getBrevo(): brevo.TransactionalEmailsApi {
  if (!brevoInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    brevoInstance = apiInstance;
  }
  
  return brevoInstance;
}

export async function sendEmail(params: {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender?: { email: string; name?: string };
}) {
  const brevoApi = getBrevo();
  
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.to = params.to;
  sendSmtpEmail.subject = params.subject;
  sendSmtpEmail.htmlContent = params.htmlContent;
  sendSmtpEmail.textContent = params.textContent;
  sendSmtpEmail.sender = params.sender || {
    email: process.env.BREVO_SENDER_EMAIL || 'noreply@yourdomain.com',
    name: process.env.BREVO_SENDER_NAME || 'Your App'
  };
  
  return await brevoApi.sendTransacEmail(sendSmtpEmail);
}