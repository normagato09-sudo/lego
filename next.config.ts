import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Identifica cada despliegue de Vercel; en local es "dev" y no hay aviso de versión nueva.
    NEXT_PUBLIC_APP_VERSION: process.env.VERCEL_DEPLOYMENT_ID ?? "dev",
  },
  experimental: {
    serverActions: {
      // Por defecto es 1 MB; las fotos de piezas se envían por server action.
      // 4.5 MB es el máximo que acepta una función de Vercel.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
