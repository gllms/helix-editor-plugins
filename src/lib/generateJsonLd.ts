import type { IPlugin } from "../routes/plugins.remote";

export default function generateJsonLd(plugins: IPlugin[]) {
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Helix Editor Plugins",
    itemListElement: plugins.map((plugin, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: plugin.name,
        description: plugin.description,
        url: plugin.url,
        operatingSystem: ["Linux", "MacOS", "Windows"],
        offers: {
          "@type": "Offer",
          price: 0,
        },
        applicationCategory: "DeveloperApplication",
        dateCreated: plugin.created_at.toISOString(),
        dateModified: plugin.updated_at.toISOString(),
        keywords: plugin.tags?.join(", ") || "",
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/LikeAction",
          userInteractionCount: plugin.star_count,
        },
      },
    })),
  });

  // Prevent a plugin's name/description from breaking out of the <script type="application/ld+json">
  // tag it's embedded in (e.g. via "</script><script>...").
  return json.replace(/</g, "\\u003c");
}