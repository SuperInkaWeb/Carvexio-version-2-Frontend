import type { NextConfig } from "next";

const allowedDevOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...(process.env.NEXT_ALLOWED_DEV_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  allowedDevOrigins:
    process.env.NODE_ENV === "development"
      ? Array.from(new Set(allowedDevOrigins))
      : undefined,
 // Eliminamos los rewrites para que las peticiones pasen por el Proxy seguro en /api/backend
 async rewrites() {
  return [];
},
 // Cabeceras de seguridad estaticas (ID-006). La CSP se emite en middleware.ts
 // porque requiere un nonce por request (actualmente en modo Report-Only).
 async headers() {
  return [
   {
    source: "/:path*",
    headers: [
     { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
     { key: "X-Frame-Options", value: "DENY" },
     { key: "X-Content-Type-Options", value: "nosniff" },
     { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
     { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
    ],
   },
  ];
 },
};

export default nextConfig;
