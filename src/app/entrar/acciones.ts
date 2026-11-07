"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, UN_ANO_EN_SEGUNDOS, firmaSesion, iguales, resumen } from "@/lib/sesion-firma";

export type EstadoEntrar = { error?: string };

export async function entrar(_antes: EstadoEntrar, datos: FormData): Promise<EstadoEntrar> {
  const contrasena = process.env.APP_PASSWORD;
  if (!contrasena) {
    return { error: "Todavía no hay contraseña configurada en Vercel (APP_PASSWORD)." };
  }

  const escrita = String(datos.get("contrasena") ?? "");
  if (!iguales(await resumen(escrita), await resumen(contrasena))) {
    // Una pequeña espera para que no se puedan probar miles de contraseñas seguidas.
    await new Promise((r) => setTimeout(r, 1000));
    return { error: "Contraseña incorrecta." };
  }

  const galletas = await cookies();
  galletas.set(COOKIE_SESION, await firmaSesion(contrasena), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: UN_ANO_EN_SEGUNDOS,
  });
  redirect("/");
}
