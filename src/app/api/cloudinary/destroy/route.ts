import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { safeUserId } from "@/lib/safeUserId";

export async function POST(req: Request) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { public_id } = body;

    if (!public_id || typeof public_id !== "string") {
        return NextResponse.json({ error: "missing_public_id" }, { status: 400 });
    }

    // Security Check: Ensure the public_id belongs to the user's folder
    const userFolder = `tierless-users/${safeUserId(userId)}`;
    if (!public_id.startsWith(userFolder)) {
        console.error(`[Cloudinary Destroy] Unauthorized deletion attempt. User: ${userId}, Target: ${public_id}`);
        return NextResponse.json({ error: "unauthorized_resource" }, { status: 403 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return NextResponse.json({ error: "server_configuration_error" }, { status: 500 });
    }

    // Call Cloudinary Admin API to destroy the image
    // Note: We use the Admin API or the Upload API with 'destroy' method.
    // The Upload API 'destroy' method requires a signature.
    // The Admin API requires Basic Auth.
    // Let's use the Upload API 'destroy' endpoint which is easier to sign.

    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = `public_id=${public_id}&timestamp=${timestamp}`;

    const crypto = require("crypto");
    const signature = crypto
        .createHash("sha1")
        .update(paramsToSign + apiSecret)
        .digest("hex");

    const formData = new FormData();
    formData.append("public_id", public_id);
    formData.append("api_key", apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("signature", signature);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (data.result !== "ok") {
            console.error("[Cloudinary Destroy] Failed:", data);
            return NextResponse.json({ error: "destroy_failed", details: data }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Cloudinary Destroy] Error:", error);
        return NextResponse.json({ error: "internal_error" }, { status: 500 });
    }
}
