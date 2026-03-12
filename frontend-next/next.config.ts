import type { NextConfig } from "next";

const djangoApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL ?? '';
const fastapiUrl   = process.env.NEXT_PUBLIC_FASTAPI_URL   ?? '';

// CSP connect-src needs origins (without path) so subpaths like /api/auth/login/ are allowed.
// Strip any trailing path (e.g. "/api") from the Django base URL.
const djangoOrigin = djangoApiUrl ? djangoApiUrl.replace(/\/api\/?$/, '') : '';

const connectSrcAllowlist = [
  "'self'",
  "https://accounts.google.com",
  "https://oauth2.googleapis.com",
  djangoOrigin,
  fastapiUrl,
  "ws://localhost:*",
  "wss://localhost:*",
].filter(Boolean).join(' ');

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      `connect-src ${connectSrcAllowlist}`,
      "frame-src https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/signup", destination: "/auth/signup", permanent: true },
      { source: "/verify-email", destination: "/auth/verify-email", permanent: true },
      { source: "/quiz", destination: "/quiz/create", permanent: true },
      { source: "/flashcard", destination: "/flashcards", permanent: true },
      { source: "/ai", destination: "/ai-tutor", permanent: true },
      { source: "/chat", destination: "/ai-tutor", permanent: true },
      { source: "/chatbot", destination: "/ai-tutor", permanent: true },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },

  // Compiler options for production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },

  // Disable x-powered-by header
  poweredByHeader: false,

  // Strict mode for catching bugs early
  reactStrictMode: true,
};

export default nextConfig;
