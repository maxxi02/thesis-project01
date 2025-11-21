// api/send-welcome-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBrevo } from "@/lib/resend/resend";

const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@yourdomain.com";
const APP_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

interface SendWelcomeEmailRequest {
  user: {
    email: string;
    name: string;
    role: string;
  };
  tempPassword: string;
  isResend?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWelcomeEmailRequest = await request.json();
    const { user, tempPassword, isResend = false } = body;

    // Validate required fields
    if (!user?.email || !user?.name || !tempPassword) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: user.email, user.name, and tempPassword are required",
        },
        { status: 400 }
      );
    }

    // Get Brevo instance
    let brevo;
    try {
      brevo = getBrevo();
      console.log("Brevo instance created successfully");
    } catch (brevoError) {
      console.error("Failed to initialize Brevo:", brevoError);
      return NextResponse.json(
        {
          error: "Email service configuration error",
          details: brevoError instanceof Error ? brevoError.message : "Failed to initialize Brevo",
        },
        { status: 500 }
      );
    }

    // Email subject and content based on whether it's a new user or resend
    const subject = isResend
      ? "Your Account Credentials - LGW Warehouse"
      : "Welcome to LGW Warehouse - Account Created";

    const emailContent = generateEmailContent(user, tempPassword, isResend);

    console.log("Attempting to send email to:", user.email);
    console.log("Using sender email:", SENDER_EMAIL);

    // Send email using Brevo
    const emailResponse = await brevo.sendTransacEmail({
      sender: {
        email: SENDER_EMAIL,
        name: "LGW Warehouse",
      },
      to: [
        {
          email: user.email,
          name: user.name,
        },
      ],
      subject: subject,
      htmlContent: emailContent,
      textContent: generatePlainTextContent(user, tempPassword, isResend),
    });

    return NextResponse.json(
      {
        success: true,
        message: `Welcome email sent successfully to ${user.email}`,
        emailId: emailResponse.body.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send welcome email error:", error);
    
    // Log more detailed error information
    if (error && typeof error === 'object') {
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
    
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
        fullError: error && typeof error === 'object' ? JSON.stringify(error) : String(error),
      },
      { status: 500 }
    );
  }
}

function generateEmailContent(
  user: { email: string; name: string; role: string },
  tempPassword: string,
  isResend: boolean
): string {
  const greeting = isResend
    ? `Hello ${user.name},`
    : `Welcome to LGW Warehouse, ${user.name}!`;

  const introText = isResend
    ? "Here are your updated account credentials:"
    : "Your account has been created successfully. Here are your login credentials:";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isResend ? "Account Credentials" : "Welcome to LGW Warehouse"}</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .credentials-box {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .credential-item {
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .credential-label {
                font-weight: bold;
                color: #374151;
                margin-right: 10px;
            }
            .credential-value {
                color: #1f2937;
                font-family: monospace;
                background-color: #fff;
                padding: 4px 8px;
                border-radius: 4px;
                display: inline-block;
            }
            .cta-button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
                text-align: center;
            }
            .warning-box {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
            }
            .warning-text {
                color: #92400e;
                font-size: 14px;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 14px;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">LGW Warehouse</div>
                <h1>${isResend ? "Account Credentials" : "Welcome!"}</h1>
            </div>
            
            <p>${greeting}</p>
            <p>${introText}</p>
            
            <div class="credentials-box">
                <div class="credential-item">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">${user.email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Temporary Password:</span>
                    <span class="credential-value">${tempPassword}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Role:</span>
                    <span class="credential-value">${user.role}</span>
                </div>
            </div>
            
            <div class="warning-box">
                <p class="warning-text">
                    <strong>Important:</strong> This is a temporary password. Please log in and change your password immediately for security reasons.
                </p>
            </div>
            
            <div style="text-align: center;">
                <a href="${APP_URL}/login" class="cta-button">Login to Your Account</a>
            </div>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <div class="footer">
                <p>This email was sent from LGW Warehouse System</p>
                <p>If you didn't expect this email, please contact your administrator.</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

function generatePlainTextContent(
  user: { email: string; name: string; role: string },
  tempPassword: string,
  isResend: boolean
): string {
  const greeting = isResend
    ? `Hello ${user.name},`
    : `Welcome to LGW Warehouse, ${user.name}!`;

  const introText = isResend
    ? "Here are your updated account credentials:"
    : "Your account has been created successfully. Here are your login credentials:";

  return `
${greeting}

${introText}

Account Details:
- Email: ${user.email}
- Temporary Password: ${tempPassword}
- Role: ${user.role}

IMPORTANT: This is a temporary password. Please log in and change your password immediately for security reasons.

Login URL: ${APP_URL}/login

If you have any questions or need assistance, please don't hesitate to contact our support team.

---
This email was sent from LGW Warehouse System
If you didn't expect this email, please contact your administrator.
  `.trim();
}