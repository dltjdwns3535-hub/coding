import type { Metadata } from "next";

const rawSiteUrl = process.env.SITE_URL?.trim();

function readSiteUrl(value: string | undefined): URL | undefined {
  if (!value) return undefined;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("SITE_URL must be the full HTTPS production origin, for example your actual https:// domain.");
  }
  const invalidHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|example\.(com|org|net))$/.test(url.hostname)
    || /\.(localhost|test|invalid|example)$/.test(url.hostname);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash || invalidHost) {
    throw new Error("SITE_URL must be your actual HTTPS production origin, with no port, path, credentials, query, or fragment.");
  }
  return url;
}

/** Intentionally absent for local/preview builds. Never invent a canonical host. */
export const siteUrl = readSiteUrl(rawSiteUrl);
export const SITE_NAME = "사진맞춤";

export function absoluteUrl(path: string): string | undefined {
  return siteUrl ? new URL(path, siteUrl).toString() : undefined;
}

export function pageMetadata(title: string, description: string, path: string): Metadata {
  const url = absoluteUrl(path);
  return {
    title,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE_NAME,
      title: `${title} | ${SITE_NAME}`,
      description,
      ...(url ? { url } : {}),
    },
    twitter: { card: "summary", title: `${title} | ${SITE_NAME}`, description },
  };
}
