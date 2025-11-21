import * as brevo from "@getbrevo/brevo";

let brevoInstance: brevo.TransactionalEmailsApi | null = null;

// Type guard for Axios errors
interface AxiosErrorResponse {
  status?: number;
  data?: Record<string, unknown>;
  headers?: Record<string, string>;
}

interface AxiosError {
  response?: AxiosErrorResponse;
  code?: string;
  message: string;
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === "object" && error !== null && "response" in error;
}

export function getBrevo(): brevo.TransactionalEmailsApi {
  if (!brevoInstance) {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    // Log API key info for debugging (first 10 chars only)
    console.log("Brevo API Key (first 10 chars):", apiKey.substring(0, 10));
    console.log("Brevo API Key length:", apiKey.length);

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

  // Validate sender email
  const senderEmail = params.sender?.email || process.env.BREVO_SENDER_EMAIL;
  const senderName =
    params.sender?.name || process.env.BREVO_SENDER_NAME || "Your App";

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured");
  }

  console.log("Sending email with configuration:");
  console.log("- Sender:", senderEmail);
  console.log("- To:", params.to.map((t) => t.email).join(", "));
  console.log("- Subject:", params.subject);

  sendSmtpEmail.to = params.to;
  sendSmtpEmail.subject = params.subject;
  sendSmtpEmail.htmlContent = params.htmlContent;
  sendSmtpEmail.textContent = params.textContent;
  sendSmtpEmail.sender = {
    email: senderEmail,
    name: senderName,
  };

  try {
    const response = await brevoApi.sendTransacEmail(sendSmtpEmail);
    console.log("✅ Email sent successfully:", response.body);
    return response;
  } catch (error: unknown) {
    console.error("❌ Brevo send email error:", error);

    // Log more details about the error
    if (isAxiosError(error)) {
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        console.error("Error response headers:", error.response.headers);
      }

      // Provide more specific error messages
      if (error.response?.status === 403) {
        console.error("🔴 403 Error - Possible causes:");
        console.error("1. Invalid or expired API key");
        console.error("2. Sender email not verified in Brevo");
        console.error("3. Account suspended or payment issue");
        console.error("4. Using wrong API key (SMTP key instead of API key)");
        console.error("\n💡 Check: https://app.brevo.com/settings/senders");
      }
    } else {
      console.error("Unknown error type:", error);
    }

    throw error;
  }
}
