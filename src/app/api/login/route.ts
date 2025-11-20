import { NextResponse } from "next/server";
import { createAuthToken, ensureAuthTables } from "@/lib/db";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
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

    // 2. Priprema baze i tokena
    await ensureAuthTables();
    const token = await createAuthToken(email);

    // 3. PAMETNA DETEKCIJA URL-a (Rešava Localhost vs Vercel)
    // Redosled prioriteta:
    // 1. NEXT_PUBLIC_APP_URL (Ako si ga ti ručno setovao na Vercelu)
    // 2. NEXT_PUBLIC_BASE_URL (Ako koristiš to)
    // 3. VERCEL_URL (Vercel ovo sam daje za Preview deploymente, ali bez https://)
    // 4. Localhost (Fallback)
    
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_BASE_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    // Mali fix: Osiguraj da nema duplih kosih crta na kraju (ako si slučajno stavio u env)
    baseUrl = baseUrl.replace(/\/$/, ""); 

    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;
    
    console.log(`🚀 Sending Magic Link to: ${email}`);
    console.log(`🔗 Link Base URL: ${baseUrl}`);

    // 4. BRENDIRANJE (Tierless Identity)
    // Tvoja plava boja (fallback za Outlook)
    const brandColor = "#2563eb"; 
    // Tvoj gradient (Cyan -> Blue) za moderne klijente
    const brandGradient = "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)";

    // 5. Slanje Emaila
    const { data, error } = await resend.emails.send({
      from: "Tierless Login <login@tierless.net>",
      to: email,
      subject: "Log in to Tierless",
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Login to Tierless</title>
        </head>
        <body style="background-color: #f8fafc; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 100%; margin: 0 auto; padding: 40px 20px;">
            <tbody>
              <tr>
                <td align="center">
                  
                  <!-- BELA KARTICA -->
                  <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); max-width: 480px; margin: 0 auto; padding: 48px 40px; text-align: center; border: 1px solid #e2e8f0;">
                    
                    <!-- LOGO (Tekstualna verzija koja izgleda kao tvoj logo) -->
                    <div style="margin-bottom: 32px;">
                        <span style="color: ${brandColor}; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                          Tierless
                        </span>
                    </div>
                    
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 16px; line-height: 1.2;">
                      Log in to your dashboard
                    </h1>
                    
                    <p style="color: #64748b; font-size: 16px; line-height: 26px; margin: 0 0 32px;">
                      Welcome back! Click the button below to verify your email and sign in.
                    </p>

                    <!-- DUGME SA GRADIENTOM -->
                    <a href="${magicLink}" target="_blank" style="
                      display: inline-block; 
                      background-color: ${brandColor}; 
                      background-image: ${brandGradient};
                      color: #ffffff; 
                      font-size: 16px; 
                      font-weight: 600; 
                      text-decoration: none; 
                      padding: 14px 32px; 
                      border-radius: 10px; 
                      text-align: center; 
                      min-width: 200px;
                      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
                    ">
                      Log in to Tierless
                    </a>

                    <p style="color: #94a3b8; font-size: 14px; line-height: 22px; margin: 32px 0 0;">
                      Or paste this link into your browser:<br>
                      <a href="${magicLink}" style="color: ${brandColor}; text-decoration: none; font-weight: 500; word-break: break-all;">
                        ${magicLink}
                      </a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 40px 0;">
                    
                    <p style="color: #cbd5e1; font-size: 12px; line-height: 18px; margin: 0;">
                      If you didn't request this, you can safely ignore this email.<br>
                      © ${new Date().getFullYear()} Tierless.
                    </p>

                  </div>

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