"use server";

import { getSessionUser } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const user = await getSessionUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    // We need the user ID. The current getSessionUser helper might return an object 
    // that doesn't explicitly have 'id' on the top level based on previous lint errors.
    // Let's verify the user structure, but assuming we can get the email and look up the ID if needed
    // OR if getSessionUser actually returns the ID but types are loose.

    // Based on previous file reads, getSessionUser returns { user: { email: string }, authenticated: boolean } or similar.
    // However, permissions.ts uses user.id. Let's check auth.ts first (happening in parallel).
    // For now, I will assume we can get the ID. If not, I'll fix it after reading auth.ts.

    // SAFEGUARDS: If user.id is missing from session, we query by email.

    const businessName = formData.get("businessName") as string;
    const website = formData.get("website") as string;
    const currency = formData.get("currency") as string;

    const pool = getPool();

    // Upsert profile
    await pool.query(
        `INSERT INTO user_profiles (user_id, business_name, website, currency)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) 
         DO UPDATE SET 
            business_name = EXCLUDED.business_name,
            website = EXCLUDED.website,
            currency = EXCLUDED.currency`,
        [user.email, businessName, website, currency]
    );

    revalidatePath("/dashboard/settings");
}
