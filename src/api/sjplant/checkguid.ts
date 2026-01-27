"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export async function checkGuidExists(guid: string) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) {
        return { success: false, message: "Unauthorized" };
    }

    const endpoint =
        `/v2/odata/166075/BaqSvc/UDNEL_GuidFC/Data?Guid=${guid}`;

    const res = await apiFetch(endpoint, {
        method: "GET",
        authHeader,
        requireLicense: true,
        cache: "no-store",
    });

    if (!res.ok) {
        return { success: false, message: "Gagal cek GUID" };
    }

    const data = await res.json();

    return {
        success: true,
        exists: Array.isArray(data.value) && data.value.length > 0,
        data: data.value ?? [],
    };
}
