import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESION, sesionValida } from "@/lib/sesion-firma";

export async function haySesion(): Promise<boolean> {
  const galletas = await cookies();
  return sesionValida(galletas.get(COOKIE_SESION)?.value);
}

/** Si no se ha entrado con la contraseña, manda a la pantalla de entrada. */
export async function exigirSesion(): Promise<void> {
  if (!(await haySesion())) redirect("/entrar");
}
