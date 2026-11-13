/** @type {import('next').NextConfig} */
const nextConfig = {
  // firebase-admin roda só no servidor e não deve ser empacotado pelo webpack
  experimental: { serverComponentsExternalPackages: ["firebase-admin"] },
};
export default nextConfig;
