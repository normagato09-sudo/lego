import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto es 1 MB; las fotos de piezas se envían por server action.
      // 4.5 MB es el máximo que acepta una función de Vercel.
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
