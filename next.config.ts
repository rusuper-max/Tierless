import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  transpilePackages: ["iron-session"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};
export default nextConfig;