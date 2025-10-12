import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com", "ora-website.vercel.app"],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
