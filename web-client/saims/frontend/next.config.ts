import type { NextConfig } from "next";

const parsePublicMinio = () => {
  const raw = process.env.NEXT_PUBLIC_MINIO_URL;
  if (!raw) return null;

  const normalized = raw.startsWith("http://") || raw.startsWith("https://")
    ? raw
    : `http://${raw}`;

  try {
    const url = new URL(normalized);
    return {
      protocol: (url.protocol.replace(":", "") || "http") as "http" | "https",
      hostname: url.hostname,
      port: url.port || undefined,
    };
  } catch {
    return null;
  }
};

const publicMinio = parsePublicMinio();

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  {
    protocol: "http",
    hostname: "localhost",
    port: "9000",
    pathname: "/inventory-assets/**",
  },
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "9000",
    pathname: "/inventory-assets/**",
  },
];

if (publicMinio) {
  remotePatterns.push({
    protocol: publicMinio.protocol,
    hostname: publicMinio.hostname,
    port: publicMinio.port,
    pathname: "/inventory-assets/**",
  });
}

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.249"],
  reactStrictMode: false,
  images: {
    remotePatterns,
    unoptimized: true,
  },
};

export default nextConfig;
