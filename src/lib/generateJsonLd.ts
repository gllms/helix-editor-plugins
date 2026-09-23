import type { IPlugin } from "../routes/plugins.remote";
import { getRepositoryPath } from "./repositorySources";

export const SITE_URL = "https://helix-editor-plugins.com";

export function getPluginPageUrl(plugin: IPlugin) {
  return `${SITE_URL}/plugin/${encodeURIComponent(plugin.name)}`;
}

function pluginToSoftwareApplication(plugin: IPlugin) {
  const pageUrl = getPluginPageUrl(plugin);
  const owner = getRepositoryPath(plugin.repository).split("/")[0];

  return {
    "@type": "SoftwareApplication",
    "@id": `${pageUrl}#software`,
    name: plugin.name,
    description: plugin.description,
    url: pageUrl,
    sameAs: plugin.url,
    author: {
      "@type": "Person",
      name: owner,
      url: `${new URL(plugin.url).origin}/${owner}`,
    },
    operatingSystem: ["Linux", "macOS", "Windows"],
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "USD",
    },
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Helix editor plugin",
    dateCreated: plugin.created_at.toISOString(),
    dateModified: plugin.updated_at.toISOString(),
    keywords: plugin.tags?.join(", ") || "",
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: plugin.star_count,
    },
  };
}

function serialize(data: unknown) {
  // Prevent a plugin's name/description from breaking out of the <script type="application/ld+json">
  // tag it's embedded in (e.g. via "</script><script>...").
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function generateJsonLd(plugins: IPlugin[]) {
  return serialize({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Helix Editor Plugins",
    itemListElement: plugins.map((plugin, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: pluginToSoftwareApplication(plugin),
    })),
  });
}

export function generatePluginJsonLd(plugin: IPlugin) {
  const pageUrl = getPluginPageUrl(plugin);

  return serialize({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: `${plugin.name} - Helix Editor Plugins`,
        description: plugin.description,
        isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}/`, url: `${SITE_URL}/` },
        mainEntity: { "@id": `${pageUrl}#software` },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      pluginToSoftwareApplication(plugin),
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Helix Editor Plugins",
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: plugin.name,
            item: pageUrl,
          },
        ],
      },
    ],
  });
}
