import type { NextConfig } from "next";

const nextConfig = {
  images: {
    domains: ["images.unsplash.com", "ora-website.vercel.app","img.clerk.com"],
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
