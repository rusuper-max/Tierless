// src/lib/email.ts
// Centralized email service using Resend

import { Resend } from "resend";
import { RESEND_API_KEY, EMAIL_FROM, BASE_URL } from "./env";

// Brand colors (matching login email)
const COLORS = {
  mainBg: "#020617",
  cardBg: "#090c1b",
  borderColor: "rgba(148,163,184,0.15)",
  gradientStart: "#4F46E5",
  gradientEnd: "#22D3EE",
  textPrimary: "#F9FAFB",
  textMuted: "#9CA3AF",
  textLink: "#22D3EE",
};

function getResend(): Resend | null {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not configured - emails will not be sent");
    return null;
  }
  return new Resend(RESEND_API_KEY);
}

// Email wrapper template
function emailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="color-scheme" content="dark">
      <title>Tierless</title>
    </head>
    <body style="background-color: ${COLORS.mainBg}; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; height: 100%; background-color: ${COLORS.mainBg};">
        <tbody>
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 460px; width: 100%;">
                <tbody>
                  <tr>
                    <td style="background-color: ${COLORS.cardBg}; border-radius: 24px; border: 1px solid ${COLORS.borderColor}; padding: 48px 40px; text-align: center; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">

                      <!-- LOGO -->
                      <div style="margin-bottom: 32px;">
                        <span style="color: ${COLORS.textPrimary}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                          Tierless
                        </span>
                      </div>

                      ${content}

                      <hr style="border: none; border-top: 1px solid ${COLORS.borderColor}; margin: 40px 0;">

                      <!-- FOOTER -->
                      <p style="color: #64748B; font-size: 12px; line-height: 18px; margin: 0;">
                        © ${new Date().getFullYear()} Tierless.
                      </p>

                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function gradientButton(href: string, text: string): string {
  return `
    <a href="${href}" target="_blank" style="
      display: inline-block;
      background-color: ${COLORS.gradientStart};
      background-image: linear-gradient(90deg, ${COLORS.gradientStart} 0%, ${COLORS.gradientEnd} 100%);
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 9999px;
      text-align: center;
      min-width: 180px;
      box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35);
    ">
      ${text}
    </a>
  `;
}

// ============================================
// TEAM INVITE EMAIL
// ============================================

export type TeamInviteEmailParams = {
  toEmail: string;
  teamName: string;
  role: string;
  inviterEmail: string;
};

export async function sendTeamInviteEmail(params: TeamInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    return { success: false, error: "Email not configured" };
  }

  const { toEmail, teamName, role, inviterEmail } = params;
  const invitesUrl = `${BASE_URL}/dashboard/invites`;

  const roleText = role.charAt(0).toUpperCase() + role.slice(1);

  const content = `
    <h1 style="color: ${COLORS.textPrimary}; font-size: 22px; font-weight: 600; margin: 0 0 16px; line-height: 1.3;">
      You've been invited to join a team
    </h1>

    <p style="color: ${COLORS.textMuted}; font-size: 15px; line-height: 24px; margin: 0 0 24px;">
      <strong style="color: ${COLORS.textPrimary};">${inviterEmail}</strong> has invited you to join
      <strong style="color: ${COLORS.textPrimary};">${teamName}</strong> as a <strong style="color: ${COLORS.textLink};">${roleText}</strong>.
    </p>

    <p style="color: ${COLORS.textMuted}; font-size: 14px; line-height: 22px; margin: 0 0 32px;">
      As a ${roleText}, you'll be able to ${getRoleDescription(role)}.
    </p>

    ${gradientButton(invitesUrl, "View Invitation")}

    <p style="color: ${COLORS.textMuted}; font-size: 13px; line-height: 20px; margin: 32px 0 0;">
      Or copy this link:<br>
      <a href="${invitesUrl}" style="color: ${COLORS.textLink}; text-decoration: none; word-break: break-all;">
        ${invitesUrl}
      </a>
    </p>

    <p style="color: #64748B; font-size: 12px; line-height: 18px; margin: 24px 0 0;">
      This invitation will expire in 7 days.
    </p>
  `;

  try {
    const { error } = await resend.emails.send({
      from: `Tierless <${EMAIL_FROM}>`,
      to: toEmail,
      subject: `You've been invited to join ${teamName} on Tierless`,
      html: emailTemplate(content),
    });

    if (error) {
      console.error("[email] Failed to send team invite:", error);
      return { success: false, error: error.message };
    }

    console.log(`[email] Team invite sent to ${toEmail} for team ${teamName}`);
    return { success: true };
  } catch (e) {
    console.error("[email] Exception sending team invite:", e);
    return { success: false, error: "Failed to send email" };
  }
}

function getRoleDescription(role: string): string {
  switch (role) {
    case "admin":
      return "manage team members, edit calculators, and publish changes";
    case "editor":
      return "edit calculators and collaborate with the team";
    case "viewer":
      return "view team calculators and analytics";
    default:
      return "access team resources";
  }
}
