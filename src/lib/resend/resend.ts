import * as brevo from "@getbrevo/brevo";

let brevoInstance: brevo.TransactionalEmailsApi | null = null;

export function getBrevo(): brevo.TransactionalEmailsApi {
  if (!brevoInstance) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    
    brevoInstance = new brevo.TransactionalEmailsApi();
    brevoInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
  }
  
  return brevoInstance;
}
