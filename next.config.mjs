/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["exceljs"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};
export default nextConfig;
