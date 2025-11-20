import { NextResponse } from "next/server";
import { createAuthToken, ensureAuthTables } from "@/lib/db";
import { Resend } from "resend";

export async function POST(req: Request) {
  console.log("1. API Ruta pogođena!"); // <--- START

  try {
    // Provera API ključa
    const apiKey = process.env.RESEND_API_KEY;
    console.log("2. Provera API Ključa:", apiKey ? "Postoji (Počinje sa re_...)" : "NE POSTOJI - NULL");

    if (!apiKey) {
        throw new Error("Nema RESEND_API_KEY u .env fajlu!");
    }

    const resend = new Resend(apiKey);
    const body = await req.json();
    const { email, brandColor, linkColor } = body;

    console.log("3. Primljen email:", email);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Baza
    console.log("4. Pokušavam pristup bazi...");
    await ensureAuthTables();
    const token = await createAuthToken(email);
    console.log("5. Token generisan:", token);

    // Link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/api/auth/verify?token=${token}`;

    // Slanje
    console.log("6. Šaljem zahtev ka Resendu...");
    
    const safeBrand =
      typeof brandColor === "string" && /^#([0-9A-F]{3}){1,2}$/i.test(brandColor)
        ? brandColor
        : "#111827";
    const safeLink =
      typeof linkColor === "string" && /^#([0-9A-F]{3}){1,2}$/i.test(linkColor)
        ? linkColor
        : "#4338CA";

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
        <body style="background-color: #f4f4f5; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          
          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; max-width: 100%; margin: 0 auto; padding: 40px 20px;">
            <tbody>
              <tr>
                <td align="center">
                  
                  <!-- KONTEJNER (Bela Kartica) -->
                  <div style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); max-width: 480px; margin: 0 auto; padding: 40px 32px; text-align: left; border: 1px solid #e4e4e7;">
                    
                    <!-- LOGO (Opciono - ako imaš URL logoa, otkomentariši ovo ispod i ubaci link) -->
                    <!-- <img src="https://tierless.net/logo.png" alt="Tierless" width="40" height="40" style="margin-bottom: 24px; border-radius: 8px;"> -->
                    
                    <h1 style="color: #18181b; font-size: 24px; font-weight: 600; margin: 0 0 16px; line-height: 1.3;">
                      Log in to Tierless
                    </h1>
                    
                    <p style="color: #52525b; font-size: 16px; line-height: 24px; margin: 0 0 24px;">
                      Welcome back! Click the button below to authenticate your email and sign in to your account.
                    </p>

                    <!-- GLAVNO DUGME -->
                    <a href="${magicLink}" target="_blank" style="display: inline-block; background-color: ${safeBrand}; color: #ffffff; font-size: 16px; font-weight: 500; text-decoration: none; padding: 12px 24px; border-radius: 8px; text-align: center; width: 100%; box-sizing: border-box;">
                      Log in to Tierless
                    </a>

                    <p style="color: #71717a; font-size: 14px; line-height: 20px; margin: 24px 0 0;">
                      Or verify using this link:<br>
                      <a href="${magicLink}" style="color: ${safeLink}; text-decoration: underline; word-break: break-all;">
                        ${magicLink}
                      </a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
                    
                    <p style="color: #a1a1aa; font-size: 12px; line-height: 16px; margin: 0;">
                      If you didn't request this login link, you can safely ignore this email.<br>
                      Your account is secure.
                    </p>

                  </div>
                  
                  <!-- FOOTER -->
                  <p style="color: #a1a1aa; font-size: 12px; margin: 24px 0 0; text-align: center;">
                    © ${new Date().getFullYear()} Tierless. All rights reserved.
                  </p>

                </td>
              </tr>
            </tbody>
          </table>
          
        </body>
        </html>
      `,
    });

    console.log("7. Odgovor od Resenda - DATA:", data);
    console.log("7. Odgovor od Resenda - ERROR:", error);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("🚨 VELIKA GREŠKA U API RUTI:", error);
    // Vraćamo error frontend-u da ne bi pisao "Check email" lažno
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
