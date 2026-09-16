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
};

export default nextConfig;
