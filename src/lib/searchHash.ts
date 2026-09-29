import type { IPlugin } from "../routes/plugins.remote";

export const sortOptions = {
  magic: "Magic",
  star_count: "Stars",
  updated_at: "Last updated",
  created_at: "Created",
  name: "Name",
} satisfies Partial<Record<keyof IPlugin | "magic", string>>;

export type SortBy = keyof typeof sortOptions;
export type SortDirection = "asc" | "desc";

export interface SearchState {
  query: string;
  sortBy: SortBy;
  sortDirection: SortDirection;
}

export function defaultSortDirection(sortBy: SortBy): SortDirection {
  return sortBy === "name" ? "asc" : "desc";
}

function isSortBy(value: string | null): value is SortBy {
  return value !== null && Object.hasOwn(sortOptions, value);
}

export function toSearchHash({
  query = "",
  sortBy = "magic",
  sortDirection = defaultSortDirection(sortBy),
}: Partial<SearchState>) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (sortBy !== "magic") params.set("sort", sortBy);
  if (sortDirection !== defaultSortDirection(sortBy)) params.set("order", sortDirection);
  return params.size ? `#${params}` : "";
}

export function fromSearchHash(hash: string): SearchState {
  const params = new URLSearchParams(hash.slice(1));
  const sort = params.get("sort");
  const sortBy = isSortBy(sort) ? sort : "magic";
  const order = params.get("order");
  return {
    query: params.get("q") ?? "",
    sortBy,
    sortDirection: order === "asc" || order === "desc" ? order : defaultSortDirection(sortBy),
  };
}
