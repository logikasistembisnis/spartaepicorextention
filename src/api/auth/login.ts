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
  const username = (formData.get("username") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
  }

  try {
    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");
    const authHeader = `Basic ${basicAuth}`;

    const response = await apiFetch(`/v2/Ice.BO.UserFileSvc/ValidatePassword`, {
      method: "POST",
      authHeader,
      requireLicense: true,
      apiMode: "epicor",
      body: JSON.stringify({
        userID: username,
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Epicor Login Error:", data);
      const errorMsg = data.ErrorMessage || "Username atau password salah.";
      return { error: errorMsg };
    }

    if (data.returnObj === true) {
      const cookieStore = await cookies();

      cookieStore.set("session_auth", authHeader, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      return { success: true };
    } else {
      return { error: "Validasi password gagal." };
    }
  } catch (err) {
    console.error("Login System Error:", err);
    return { error: "Terjadi kesalahan sistem." };
  }
}