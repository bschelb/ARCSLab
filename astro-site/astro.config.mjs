import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://arcslab.io",
  build: {
    format: "file",
  },
  integrations: [
    sitemap({
      // The site serves and links pages extensionless (e.g. /research, served as
      // research.html by GitHub Pages). Strip the .html so sitemap URLs match the
      // <link rel="canonical"> on each page.
      serialize(item) {
        item.url = item.url.replace(/index\.html$/, "").replace(/\.html$/, "");
        return item;
      },
    }),
  ],
});
