/**
 * Open States People — GitHub Data Loader
 *
 * Pulls state legislator data from the public-domain YAML files at:
 * https://github.com/openstates/people
 *
 * Structure: data/{state_abbr}/legislature/*.yml
 * Each YAML file = one legislator with name, party, district, contact, links, etc.
 *
 * We fetch the JSON API listing from GitHub to get file paths, then fetch
 * individual files. Results are cached aggressively since this data changes
 * infrequently (updated ~weekly).
 */

const GITHUB_API_BASE =
  "https://api.github.com/repos/openstates/people/contents";
const RAW_BASE =
  "https://raw.githubusercontent.com/openstates/people/main";

// Simple YAML-to-object parser for the flat structure used in these files.
// The files use a simple key: value format that doesn't need a full YAML parser.
function parseSimpleYaml(text: string): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};
  let currentKey = "";
  let inList = false;
  const listItems: string[] = [];

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();

    // Skip comments and empty lines
    if (line.startsWith("#") || line.trim() === "" || line.startsWith("---")) {
      if (inList && currentKey) {
        result[currentKey] = [...listItems];
        listItems.length = 0;
        inList = false;
      }
      continue;
    }

    // List item
    if (line.match(/^\s+-\s/)) {
      const value = line.replace(/^\s+-\s*/, "").trim();
      if (!inList) {
        inList = true;
        listItems.length = 0;
      }
      listItems.push(value);
      continue;
    }

    // Key: value
    const match = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (match) {
      if (inList && currentKey) {
        result[currentKey] = [...listItems];
        listItems.length = 0;
        inList = false;
      }
      currentKey = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (value) {
        result[currentKey] = value;
      }
    }
  }

  if (inList && currentKey) {
    result[currentKey] = [...listItems];
  }

  return result;
}

export interface StateLegislator {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  party: string;
  district: string;
  chamber: "upper" | "lower";
  email: string | null;
  image: string | null;
  links: string[];
  state: string;
}

interface GitHubContent {
  name: string;
  path: string;
  download_url: string | null;
  type: "file" | "dir";
}

/**
 * Fetch directory listing from GitHub API with basic caching headers
 */
async function fetchGitHubDir(path: string): Promise<GitHubContent[]> {
  const url = `${GITHUB_API_BASE}/${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github.v3+json" },
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!res.ok) {
    console.error(`[OpenStatesPeople] GitHub API ${res.status}: ${url}`);
    return [];
  }

  return res.json();
}

/**
 * Fetch and parse a single legislator YAML file
 */
async function fetchLegislatorFile(
  filePath: string,
  stateAbbr: string,
  chamber: "upper" | "lower"
): Promise<StateLegislator | null> {
  try {
    const url = `${RAW_BASE}/${filePath}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });

    if (!res.ok) return null;

    const text = await res.text();
    const data = parseSimpleYaml(text);

    return {
      id: (data.id as string) || filePath,
      name: (data.name as string) || "",
      firstName: (data.given_name as string) || (data.first_name as string) || "",
      lastName: (data.family_name as string) || (data.last_name as string) || "",
      party: (data.party as string) || "Unknown",
      district: (data.district as string) || "",
      chamber,
      email: (data.email as string) || null,
      image: (data.image as string) || null,
      links: Array.isArray(data.links) ? data.links : [],
      state: stateAbbr.toUpperCase(),
    };
  } catch (err) {
    console.error(`[OpenStatesPeople] Error parsing ${filePath}:`, err);
    return null;
  }
}

/**
 * Get all current state legislators for a given state.
 *
 * @param stateAbbr - Two-letter state abbreviation (e.g., "CA", "TX")
 * @returns Array of legislators from both chambers
 */
export async function getStateLegislators(
  stateAbbr: string
): Promise<StateLegislator[]> {
  const state = stateAbbr.toLowerCase();
  const legislators: StateLegislator[] = [];

  // The repo organizes by: data/{state}/legislature/
  // with subdirectories or files per chamber
  const basePath = `data/${state}/legislature`;

  const contents = await fetchGitHubDir(basePath);

  if (contents.length === 0) {
    // Try alternative structure: data/{state}/people/
    const altContents = await fetchGitHubDir(`data/${state}/people`);
    if (altContents.length === 0) return [];

    const files = altContents.filter(
      (f) => f.type === "file" && f.name.endsWith(".yml")
    );

    const results = await Promise.all(
      files.map((f) =>
        fetchLegislatorFile(f.path, stateAbbr, "upper")
      )
    );

    return results.filter((r): r is StateLegislator => r !== null);
  }

  // Check for chamber subdirectories (upper/, lower/) or flat files
  const dirs = contents.filter((c) => c.type === "dir");
  const files = contents.filter(
    (c) => c.type === "file" && c.name.endsWith(".yml")
  );

  if (dirs.length > 0) {
    for (const dir of dirs) {
      const chamber = dir.name.includes("upper") || dir.name.includes("senate")
        ? "upper"
        : "lower";

      const chamberContents = await fetchGitHubDir(dir.path);
      const chamberFiles = chamberContents.filter(
        (f) => f.type === "file" && f.name.endsWith(".yml")
      );

      const results = await Promise.all(
        chamberFiles.map((f) =>
          fetchLegislatorFile(f.path, stateAbbr, chamber)
        )
      );

      legislators.push(
        ...results.filter((r): r is StateLegislator => r !== null)
      );
    }
  }

  if (files.length > 0) {
    const results = await Promise.all(
      files.map((f) =>
        fetchLegislatorFile(f.path, stateAbbr, "upper")
      )
    );
    legislators.push(
      ...results.filter((r): r is StateLegislator => r !== null)
    );
  }

  return legislators;
}

/**
 * Get legislators for a specific chamber
 */
export async function getStateLegislatorsByChamber(
  stateAbbr: string,
  chamber: "upper" | "lower"
): Promise<StateLegislator[]> {
  const all = await getStateLegislators(stateAbbr);
  return all.filter((l) => l.chamber === chamber);
}
