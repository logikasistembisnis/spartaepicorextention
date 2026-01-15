"use server";

import { cookies } from "next/headers";

type ActionState = {
  error?: string;
  success?: boolean;
};

export async function loginAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  // Validasi sederhana
  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiKey = process.env.API_KEY;

  if (!apiUrl || !apiKey) {
    return { error: "Konfigurasi server error (ENV missing)." };
  }

  const isProd = process.env.NODE_ENV === "production";

  try {
    // Basic Auth token (base64 encoded username:password)
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const authHeaderValue = `Basic ${basicAuth}`;

    const response = await fetch(
      `${apiUrl}/v1/Ice.BO.UserFileSvc/ValidatePassword`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey, // Dari env
          Authorization: authHeaderValue, // Basic Auth
        },
        body: JSON.stringify({
          userID: username,
          password: password,
        }),
      }
    );

    if (!response.ok) {
      // Handle jika login gagal dari API (misal 401 Unauthorized)
      return { error: "Login gagal. Cek kembali username dan password." };
    }

    const data = await response.json();

    // Cek apakah returnObj true
    if (data.returnObj === true) {
      const cookieStore = await cookies();

      cookieStore.set("session_auth", authHeaderValue, {
        httpOnly: true, // JS browser gak bisa baca (aman dari XSS)
        secure: false, // Hanya HTTPS di production
        sameSite: "lax", // Perlindungan CSRF
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
