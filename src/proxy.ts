import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, sesionValida } from "@/lib/sesion-firma";

// Antes de abrir cualquier pantalla, comprueba que se ha entrado con la contraseña.
export async function proxy(request: NextRequest) {
  const valida = await sesionValida(request.cookies.get(COOKIE_SESION)?.value);
  const { pathname } = request.nextUrl;

  if (pathname === "/entrar") {
    // Si ya has entrado, no hace falta volver a poner la contraseña.
    return valida ? NextResponse.redirect(new URL("/", request.url)) : NextResponse.next();
  }

  if (valida) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return new NextResponse("Hace falta la contraseña.", { status: 401 });
  }
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  // Todo menos los archivos que el navegador necesita para mostrar el icono
  // e instalar la app (estos no tienen datos tuyos).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|iconos/).*)"],
};
