import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

export async function GET(context) {
  const posts = (await getCollection("blog")).filter((p) => !p.data.draft);

  return rss({
    title: "Mobile Infrastructure & Automation Blog",
    description:
      "Two posts per week on mobile CI/CD, device labs, build systems, and DevOps.",
    site: context.site,
    items: posts.map((post) => {
      const baseUrl = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
      return {
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `${baseUrl}${post.slug}/`,
      };
    }),
    customData: "<language>en-us</language>",
  });
}
