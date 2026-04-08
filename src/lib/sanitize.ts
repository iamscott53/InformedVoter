import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize HTML content from external APIs before rendering.
 * Strips scripts, event handlers, and dangerous attributes while
 * preserving safe markup (paragraphs, links, lists, emphasis).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u",
      "ul", "ol", "li", "a", "blockquote", "h1", "h2", "h3", "h4",
      "span", "div", "sup", "sub",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "class"],
    ALLOW_DATA_ATTR: false,
  });
}
