import { createHash } from "node:crypto";
import type { Element, ElementContent, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Component } from "svelte";
import { render } from "svelte/server";
import { unified } from "unified";
import { EXIT, visit } from "unist-util-visit";
import type { IReadmeFile } from "$lib/loadReadme";
import warn from "$lib/warn";

import IconArrowSquareOutBold from "phosphor-icons-svelte/IconArrowSquareOutBold.svelte";
import IconChatCenteredDotsBold from "phosphor-icons-svelte/IconChatCenteredDotsBold.svelte";
import IconInfoBold from "phosphor-icons-svelte/IconInfoBold.svelte";
import IconLightbulbBold from "phosphor-icons-svelte/IconLightbulbBold.svelte";
import IconWarningBold from "phosphor-icons-svelte/IconWarningBold.svelte";
import IconWarningOctagonBold from "phosphor-icons-svelte/IconWarningOctagonBold.svelte";

export interface IReadmeImage {
  body: ArrayBuffer;
  type: string;
}

// The prefix rehype-sanitize gives ids in the README's HTML
const ID_PREFIX = "readme-content-";

const USER_AGENT = "helix-editor-plugins.com (+https://github.com/gllms/helix-editor-plugins)";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: "" })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeSlug, { prefix: ID_PREFIX })
  // Only lets through the icons, which are added after sanitizing
  .use(rehypeStringify, { allowDangerousHtml: true });

function renderIcon(icon: Component<{ class?: string }>, className?: string) {
  return render(icon, { props: { class: className } }).body.replace(/<!--.*?-->/g, "");
}

const externalLinkIcon = renderIcon(IconArrowSquareOutBold, "external-link-icon");

const alertIcons = {
  note: IconInfoBold,
  tip: IconLightbulbBold,
  important: IconChatCenteredDotsBold,
  warning: IconWarningBold,
  caution: IconWarningOctagonBold,
};

export default async function renderReadme(
  readme: IReadmeFile,
  options: { pluginName: string; getImageUrl: (fileName: string) => string },
) {
  const tree = await processor.run(processor.parse(readme.markdown));

  replacePicturesWithDarkImages(tree);
  renderAlerts(tree);
  removeTitle(tree, options.pluginName);
  resolveRelativeUrls(tree, readme);
  fixFragmentLinks(tree);
  shiftHeadings(tree);
  const images = await downloadImages(tree, readme, options.getImageUrl);

  return { html: processor.stringify(tree), images };
}

function removeTitle(tree: Root, pluginName: string) {
  const normalize = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "")
      .replace(/\.hx$/, "")
      .replace(/\./g, "");

  visit(tree, "element", (node, index, parent) => {
    if (!/^h[1-6]$/.test(node.tagName)) return;

    if (parent && index !== undefined && normalize(toString(node)) === normalize(pluginName)) {
      parent.children.splice(index, 1);
    }
    return EXIT;
  });
}

function renderAlerts(tree: Root) {
  visit(tree, "element", (node) => {
    if (node.tagName !== "blockquote") return;

    const paragraph = node.children.find((child) => child.type === "element");
    const marker = paragraph?.tagName === "p" ? paragraph.children[0] : undefined;
    if (!paragraph || marker?.type !== "text") return;

    const isBreak = (node?: ElementContent) => node?.type === "element" && node.tagName === "br";

    // The marker has to be on a line of its own, ended by a newline or a <br> (two trailing spaces)
    const match = /^\[!(note|tip|important|warning|caution)\][ \t]*(\n|$)/i.exec(marker.value);
    const next = paragraph.children[1];
    if (!match || (!match[2] && next && !isBreak(next))) return;

    marker.value = marker.value.slice(match[0].length);
    if (!marker.value) paragraph.children.shift();
    if (!match[2] && isBreak(paragraph.children[0])) paragraph.children.shift();
    const first = paragraph.children[0];
    if (first?.type === "text") first.value = first.value.trimStart();
    if (!toString(paragraph).trim()) node.children.splice(node.children.indexOf(paragraph), 1);

    const type = match[1].toLowerCase() as keyof typeof alertIcons;
    node.tagName = "div";
    node.properties = { className: ["markdown-alert", `markdown-alert-${type}`] };
    node.children.unshift({
      type: "element",
      tagName: "p",
      properties: { className: ["markdown-alert-title"] },
      children: [
        { type: "raw", value: renderIcon(alertIcons[type]) },
        { type: "text", value: type[0].toUpperCase() + type.slice(1) },
      ],
    });
  });
}

function replacePicturesWithDarkImages(tree: Root) {
  visit(tree, "element", (node, index, parent) => {
    if (node.tagName !== "picture" || !parent || index === undefined) return;

    const children = node.children.filter((child) => child.type === "element");
    const img = children.find((child) => child.tagName === "img");
    const darkSource = children.find(
      (child) =>
        child.tagName === "source" &&
        /prefers-color-scheme:\s*dark/.test(String(child.properties.media)),
    );

    const srcSet = darkSource?.properties.srcSet;
    const darkSrc = String((Array.isArray(srcSet) ? srcSet[0] : srcSet) ?? "")
      .trim()
      .split(/\s+/)[0];
    if (img && darkSrc) img.properties.src = darkSrc;

    parent.children.splice(index, 1, ...(img ? [img] : []));
    return index;
  });
}

function resolveRelativeUrls(tree: Root, readme: IReadmeFile) {
  visit(tree, "element", (node) => {
    const { href, src } = node.properties;

    if (node.tagName === "a" && typeof href === "string" && !href.startsWith("#")) {
      node.properties.href = resolveUrl(href, readme.htmlUrl, readme.path);
      if (/^https?:/.test(node.properties.href)) {
        node.properties.target = "_blank";

        // Links that are only an image, like badges, don't get the icon
        if (toString(node).trim()) {
          node.children.push(
            // A word joiner, so the icon can't wrap onto a line of its own
            { type: "text", value: "⁠" },
            { type: "raw", value: externalLinkIcon },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["visually-hidden"] },
              children: [{ type: "text", value: " (opens in a new tab)" }],
            },
          );
        }
      }
    }

    if (node.tagName === "img" && typeof src === "string") {
      node.properties.src = toRawFileUrl(resolveUrl(src, readme.rawUrl, readme.path));
    }
  });
}

function resolveUrl(url: string, fileUrl: string, filePath: string) {
  try {
    // Repository hosts resolve root-relative URLs against the root of the repository
    if (url.startsWith("/") && !url.startsWith("//")) {
      const rootUrl = fileUrl.endsWith(filePath)
        ? fileUrl.slice(0, -filePath.length)
        : new URL(".", fileUrl).href;
      return new URL(url.slice(1), rootUrl).href;
    }
    return new URL(url, fileUrl).href;
  } catch {
    return url;
  }
}

function toRawFileUrl(url: string) {
  return url
    .replace(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\//, "https://github.com/$1/raw/")
    .replace(/^https:\/\/codeberg\.org\/([^/]+\/[^/]+)\/src\//, "https://codeberg.org/$1/raw/");
}

function fixFragmentLinks(tree: Root) {
  const ids = new Set<string>();
  visit(tree, "element", (node) => {
    for (const value of [node.properties.id, node.properties.name]) {
      if (typeof value === "string") ids.add(value);
    }
  });

  visit(tree, "element", (node, index, parent) => {
    const { href } = node.properties;
    if (node.tagName !== "a" || typeof href !== "string" || !href.startsWith("#")) return;

    let fragment = href.slice(1);
    try {
      fragment = decodeURIComponent(fragment);
    } catch {}

    const id = [fragment, ID_PREFIX + fragment, ID_PREFIX + fragment.toLowerCase()].find((id) =>
      ids.has(id),
    );

    if (id) {
      node.properties.href = `#${id}`;
    } else if (parent && index !== undefined) {
      // SvelteKit fails the build on links to ids that don't exist
      parent.children.splice(index, 1, ...node.children);
      return index;
    }
  });
}

function shiftHeadings(tree: Root) {
  const headings: { node: Element; level: number }[] = [];
  visit(tree, "element", (node) => {
    const level = /^h([1-6])$/.exec(node.tagName)?.[1];
    if (level) headings.push({ node, level: Number(level) });
  });

  const offset = 2 - Math.min(...headings.map(({ level }) => level));
  for (const { node, level } of headings) {
    node.tagName = `h${Math.min(level + offset, 6)}`;
  }
}

async function downloadImages(
  tree: Root,
  readme: IReadmeFile,
  getImageUrl: (fileName: string) => string,
) {
  const images = new Map<string, IReadmeImage>();
  const imgElements: Element[] = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "img" && typeof node.properties.src === "string") imgElements.push(node);
  });

  const fileNamesByUrl = new Map<string, Promise<string | null>>();

  await Promise.all(
    imgElements.map(async (img) => {
      const src = String(img.properties.src);

      if (!fileNamesByUrl.has(src)) {
        fileNamesByUrl.set(
          src,
          downloadImage(src).then(
            ({ fileName, image }) => {
              images.set(fileName, image);
              return fileName;
            },
            (error) => {
              warn(
                "README image not downloaded",
                `Couldn't download ${src} in ${readme.htmlUrl}, so it's loaded from there instead: ${error instanceof Error ? error.message : error}`,
              );
              return null;
            },
          ),
        );
      }

      const fileName = await fileNamesByUrl.get(src);
      if (fileName) img.properties.src = getImageUrl(fileName);
      img.properties.loading = "lazy";
    }),
  );

  return images;
}

async function downloadImage(url: string) {
  const response = await fetch(url, {
    // Some hosts, like Wikimedia, reject requests without a descriptive user agent
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`Got a ${response.status} response`);
  }

  const body = await response.arrayBuffer();
  const imageType = detectImageType(body);
  if (!imageType) {
    throw new Error(`Unsupported image type ${response.headers.get("Content-Type")}`);
  }

  const hash = createHash("sha256").update(Buffer.from(body)).digest("hex").slice(0, 16);

  return {
    fileName: `${hash}.${imageType.extension}`,
    image: { body, type: imageType.type },
  };
}

function detectImageType(body: ArrayBuffer) {
  const head = Buffer.from(body, 0, Math.min(body.byteLength, 4096)).toString("latin1");

  if (head.startsWith("\x89PNG")) return { type: "image/png", extension: "png" };
  if (head.startsWith("\xff\xd8\xff")) return { type: "image/jpeg", extension: "jpg" };
  if (head.startsWith("GIF8")) return { type: "image/gif", extension: "gif" };
  if (head.startsWith("RIFF") && head.slice(8, 12) === "WEBP") {
    return { type: "image/webp", extension: "webp" };
  }
  if (/^.{4}ftypavi[fs]/s.test(head)) return { type: "image/avif", extension: "avif" };
  if (/<svg[\s>]/i.test(head)) return { type: "image/svg+xml", extension: "svg" };

  return null;
}
