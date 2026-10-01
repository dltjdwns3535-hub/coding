import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/guides/target-kb-pixels/", "/guides/image-formats/", "/privacy/"];
  return routes.flatMap(path => {
    const url = absoluteUrl(path);
    return url ? [{ url }] : [];
  });
}
