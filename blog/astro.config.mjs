import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://rakesh1988.github.io/mobile-infra-blog",
  base: "/mobile-infra-blog",
  integrations: [mdx(), sitemap()],
  build: {
    format: "file",
  },
});
