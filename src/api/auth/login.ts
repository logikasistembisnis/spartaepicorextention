"use server";

import { cookies } from "next/headers";
import { apiFetch } from "@/api/apiFetch";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Validasi sederhana
  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  try {
    // Basic Auth token (base64 encoded username:password)
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const authHeader = `Basic ${basicAuth}`;

    const response = await apiFetch(`/v1/Ice.BO.UserFileSvc/ValidatePassword`, {
      method: "POST",
      authHeader,
      requireLicense: true,
      body: JSON.stringify({
        userID: username,
        password: password,
      }),
    });

    // Cek apakah returnObj true
    const data = await response.json();
    if (data.returnObj === true) {
      const cookieStore = await cookies();

      cookieStore.set("session_auth", authHeader, {
        httpOnly: true, // JS browser gak bisa baca (aman dari XSS)
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24, // Expire 1 hari
        path: "/",
      });

      return { success: true };
    } else {
      return { error: "Validasi password gagal." };
    }
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Terjadi kesalahan koneksi." };
  }
}
