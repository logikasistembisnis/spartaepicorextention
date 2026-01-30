"use server";

import { cookies } from "next/headers";
import { UD100ARawData } from "@/types/sjPlant";
import { apiFetch } from "@/api/apiFetch";

export async function deleteLineWithLogs(
    lineRaw: UD100ARawData,
    logRaws: UD100ARawData[]
) {
    const cookieStore = await cookies();
    const authHeader = cookieStore.get("session_auth")?.value;

    if (!authHeader) return { success: false, message: "Unauthorized" };

    try {
        const payload = {
            ds: {
                UD100A: [
                    // DELETE ALL LOGS FIRST
                    ...logRaws.map(log => ({
                        ...log,
                        RowMod: "D",
                    })),

                    // DELETE LINE
                    {
                        ...lineRaw,
                        RowMod: "D",
                    },
                ],
            },
        };

        const res = await apiFetch(
            `/v1/Ice.BO.UD100Svc/Update`,
            {
                method: "POST",
                authHeader,
                requireLicense: true,
                body: JSON.stringify(payload),
                cache: "no-store",
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error(err);
            return { success: false, message: "Gagal hapus line + log" };
        }

        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Server error" };
    }
}