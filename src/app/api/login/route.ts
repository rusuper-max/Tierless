import { NextResponse } from "next/server";
import { createAuthToken } from "@/lib/db";
import { Resend } from "resend";
import { checkRateLimit, getClientIP, rateLimitHeaders, LOGIN_LIMIT } from "@/lib/rateLimit";

// NOTE: Auth tables are created by migration script (data/migrations/001_init_schema.sql)
// Do NOT call ensureAuthTables at runtime - it causes performance issues

export async function POST(req: Request) {
  try {
    // 0. Rate Limiting - 5 requests per minute per IP
    const clientIP = getClientIP(req);
    const rateResult = checkRateLimit(clientIP, LOGIN_LIMIT);
    
    if (!rateResult.success) {
      console.warn(`[LOGIN] Rate limit exceeded for IP: ${clientIP}`);
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateResult) }
      );
    }

    // 1. Provera API ključa
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ MISSING RESEND_API_KEY");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const resend = new Resend(apiKey);
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // 2. Create auth token (table created by migration)
    const token = await createAuthToken(email);

    // 3. URL Logika
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_BASE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    baseUrl = baseUrl.replace(/\/$/, ""); 
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;
    
    console.log(`🚀 Sending Magic Link to: ${email}`);

    // 4. BRAND COLORS (Dark Theme Core)
    const mainBg = "#020617"; // Tvoja glavna pozadina
    const cardBg = "#090c1b"; // Malo svetliji surface za karticu
    const borderColor = "rgba(148,163,184,0.15)"; // Subtle border
    
    // Brand Gradient (Indigo -> Cyan)
    const gradientStart = "#4F46E5";
    const gradientEnd = "#22D3EE";
    const buttonGradient = `linear-gradient(90deg, ${gradientStart} 0%, ${gradientEnd} 100%)`;
    
    // Text Colors
    const textPrimary = "#F9FAFB";
    const textMuted = "#9CA3AF";
    const textLink = "#22D3EE"; // Secondary accent za linkove

    // 5. Slanje Emaila
    const { data, error } = await resend.emails.send({
      from: "Tierless <login@tierless.net>",
      to: email,
      subject: "Log in to Tierless",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="color-scheme" content="dark">
          <title>Login to Tierless</title>
        </head>
        <body style="background-color: ${mainBg}; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; height: 100%; background-color: ${mainBg};">
            <tbody>
              <tr>
                <td align="center" style="padding: 40px 20px;">
                  
                  <!-- KARTICA -->
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 460px; width: 100%;">
                    <tbody>
                      <tr>
                        <td style="background-color: ${cardBg}; border-radius: 24px; border: 1px solid ${borderColor}; padding: 48px 40px; text-align: center; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);">
                          
                          <!-- LOGO -->
                          <div style="margin-bottom: 32px;">
                             <!-- Koristimo gradient boju za tekst logotipa ili belu -->
                             <span style="color: ${textPrimary}; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                               Tierless
                             </span>
                          </div>
                          
                          <h1 style="color: ${textPrimary}; font-size: 22px; font-weight: 600; margin: 0 0 16px; line-height: 1.3;">
                            Log in to your account
                          </h1>
                          
                          <p style="color: ${textMuted}; font-size: 15px; line-height: 24px; margin: 0 0 32px;">
                            Welcome back. Click the button below to securely sign in to your dashboard.
                          </p>

                          <!-- DUGME (Pill Shape, Gradient Background) -->
                          <!-- Email klijenti ne vole gradient bordere, pa koristimo Solid Gradient Background koji je po tvojim pravilima za 'Selected/Active' state -->
                          <a href="${magicLink}" target="_blank" style="
                            display: inline-block; 
                            background-color: ${gradientStart}; 
                            background-image: ${buttonGradient};
                            color: #ffffff; 
                            font-size: 15px; 
                            font-weight: 600; 
                            text-decoration: none; 
                            padding: 14px 32px; 
                            border-radius: 9999px; /* Pill shape */
                            text-align: center; 
                            min-width: 180px;
                            box-shadow: 0 4px 20px rgba(79, 70, 229, 0.35); /* Glow effect */
                          ">
                            Log in to Tierless
                          </a>

                          <!-- LINK FALLBACK -->
                          <p style="color: ${textMuted}; font-size: 13px; line-height: 20px; margin: 32px 0 0;">
                            Or copy this link:<br>
                            <a href="${magicLink}" style="color: ${textLink}; text-decoration: none; word-break: break-all;">
                              ${magicLink}
                            </a>
                          </p>
                          
                          <hr style="border: none; border-top: 1px solid ${borderColor}; margin: 40px 0;">
                          
                          <!-- FOOTER -->
                          <p style="color: #64748B; font-size: 12px; line-height: 18px; margin: 0;">
                            If you didn't request this login link, you can safely ignore it.<br>
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
      `,
    });

    if (error) {
      console.error("Resend Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🚨 Server Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}