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
    params.sender?.name || process.env.BREVO_SENDER_NAME || "LGW Warehouse";

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is not configured");
  }

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
    
    // Only log in development mode
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Email sent:", {
        to: params.to.map((t) => t.email).join(", "),
        subject: params.subject,
        messageId: response.body.messageId,
      });
    }
    
    return response;
  } catch (error: unknown) {
    console.error("❌ Failed to send email:", {
      to: params.to.map((t) => t.email).join(", "),
      subject: params.subject,
    });

    if (isAxiosError(error)) {
      if (error.response) {
        console.error("Error details:", {
          status: error.response.status,
          data: error.response.data,
        });

        // Provide helpful error messages for common issues
        if (error.response?.status === 403) {
          console.error("🔴 403 Forbidden - Possible causes:");
          console.error("  • Invalid or expired API key");
          console.error("  • Sender email not verified in Brevo");
          console.error("  • Account suspended or payment issue");
          console.error("  💡 Check: https://app.brevo.com/settings/senders");
        } else if (error.response?.status === 400) {
          console.error("🔴 400 Bad Request - Check email format and content");
        } else if (error.response?.status === 401) {
          console.error("🔴 401 Unauthorized - Invalid API key");
        }
      }
    } else {
      console.error("Unknown error:", error);
    }

    throw error;
  }
}