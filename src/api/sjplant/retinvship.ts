"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

export async function RetInvShip(payload: {
    SJPlant: string;
    ShipFrom: string;
    ShipTo: string;
    Date: string;
}) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) return { success: false, message: "Unauthorized" };

    const res = await apiFetch(
        "/v2/efx/166075/UDGSSJAntarPlant/ReturnInventoryTransfer",
        {
            method: "POST",
            authHeader,
            requireLicense: true,
            apiMode: "epicor",
            body: JSON.stringify({ ...payload, Check: false })
        }
    );

    const data = await res.json();
    // JIKA EPICOR ERROR
    if (!res.ok) {
        return {
            success: false,
            message:
                data?.ErrorMessage ||
                data?.ErrorDetails?.[0]?.Message ||
                "Inventory Transfer gagal"
        };
    }

    // JIKA SUKSES
    return {
        success: true,
        message: data?.output || "Inventory Transfer Success"
    };
}

