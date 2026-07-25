/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Compile the workspace UI package from source (no prebuilt dist).
  transpilePackages: ["@justice/ui"],
};

export default nextConfig;
