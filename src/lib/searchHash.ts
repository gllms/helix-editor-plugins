export function toSearchHash(query: string) {
  return query ? `#${new URLSearchParams({ q: query })}` : "";
}

export function fromSearchHash(hash: string) {
  return new URLSearchParams(hash.slice(1)).get("q") ?? "";
}
