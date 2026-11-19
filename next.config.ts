import type { NextConfig } from "next";

const devHost = process.env.SIMPLAYZ_DEV_HOST;

const config: NextConfig = {
  devIndicators: false,
  serverExternalPackages: ["@libsql/client"],
  allowedDevOrigins: devHost ? [devHost] : [],
};

export default config;
