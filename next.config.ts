import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Docker image runs .next/standalone/server.js with no node_modules.
  output: "standalone",

  // One canonical host. The proxy issues a certificate for www too, so the
  // redirect happens over https and nobody sees a warning on the way.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.crook.id" }],
        destination: "https://crook.id/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
