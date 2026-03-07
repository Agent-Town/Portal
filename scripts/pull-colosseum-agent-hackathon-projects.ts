#!/usr/bin/env bun
/**
 * Pull all Agent Hackathon project metadata from Colosseum.
 *
 * Sources:
 * - list endpoint:   https://agents.colosseum.com/api/projects/current
 * - detail endpoint: https://agents.colosseum.com/api/projects/{slug}
 *
 * Usage:
 *   bun scripts/pull-colosseum-agent-hackathon-projects.ts
 *
 * Options:
 *   --out <path>             JSON output path
 *                            (default: ./colosseum-agent-hackathon-projects.json)
 *   --sqlite-path <path>     Also upsert into SQLite at this path (optional)
 *   --dry-run                Fetch only (do not write JSON/SQLite)
 *   --limit <n>              Pagination page size (default: 100)
 *   --start-offset <n>       Initial list offset (default: 0)
 *   --max-projects <n>       Stop after N list rows (debug; 0 = unlimited)
 *   --concurrency <n>        Detail fetch concurrency (default: 8)
 *   --sort-by <field>        human_upvotes | agent_upvotes | total | created_at
 *                            (default: human_upvotes)
 *   --order <dir>            asc | desc (default: desc)
 *   --no-drafts              Exclude draft entries (default includes drafts)
 *   --skip-details           Skip /projects/{slug} enrichment fetches
 *   --base-url <url>         Override API base URL
 */

import { Database } from "bun:sqlite";
import * as fs from "node:fs";
import * as path from "node:path";

const DEFAULT_BASE_URL = "https://agents.colosseum.com/api";

type SortField = "human_upvotes" | "agent_upvotes" | "total" | "created_at";
type SortOrder = "asc" | "desc";

type ProjectListItem = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  repoLink: string | null;
  presentationLink: string | null;
  humanUpvotes: number;
  agentUpvotes: number;
  ownerAgentName: string | null;
  ownerAgentClaim: { xUsername?: string | null; xProfileImageUrl?: string | null } | null;
  teamName: string | null;
  status: string | null;
  submittedAt: string | null;
  updatedAt: string | null;
};

type ListResponse = {
  projects: ProjectListItem[];
  totalCount: number;
  hasMore: boolean;
};

type ProjectDetail = {
  id: number;
  hackathonId: number | null;
  name: string;
  slug: string;
  description: string | null;
  repoLink: string | null;
  solanaIntegration: string | null;
  problemStatement: string | null;
  technicalApproach: string | null;
  targetAudience: string | null;
  businessModel: string | null;
  competitiveLandscape: string | null;
  futureVision: string | null;
  liveAppLink: string | null;
  presentationLink: string | null;
  additionalInfo: string | null;
  imageId: number | null;
  twitterHandle: string | null;
  telegramHandle: string | null;
  tags: string[] | null;
  status: string | null;
  humanUpvotes: number;
  agentUpvotes: number;
  ownerAgentId: number | null;
  ownerAgentName: string | null;
  ownerAgentClaim: { xUsername?: string | null; xProfileImageUrl?: string | null } | null;
  teamId: number | null;
  teamName: string | null;
  submittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type TeamMember = {
  agentId: number | null;
  agentName: string | null;
  claim:
    | {
        xUserId?: string | null;
        xUsername?: string | null;
        xProfileImageUrl?: string | null;
        claimedAt?: string | null;
      }
    | null;
  joinedAt: string | null;
};

type DetailResponse = {
  project: ProjectDetail;
  teamMembers: TeamMember[];
  hasVoted: boolean;
};

type EnrichedProject = {
  id: number;
  name: string;
  slug: string;
  status: string | null;
  description: string | null;
  votes: { human: number; agent: number; total: number };
  ownerAgentName: string | null;
  ownerAgentClaim: { xUsername: string | null; xProfileImageUrl: string | null } | null;
  teamName: string | null;
  links: { repo: string | null; presentation: string | null; liveApp: string | null };
  socials: { twitter: string | null; telegram: string | null };
  tags: string[];
  solanaIntegration: string | null;
  content: {
    problemStatement: string | null;
    technicalApproach: string | null;
    targetAudience: string | null;
    businessModel: string | null;
    competitiveLandscape: string | null;
    futureVision: string | null;
    additionalInfo: string | null;
  };
  timeline: {
    submittedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  teamMembers: TeamMember[];
  sources: {
    listEndpoint: string;
    detailEndpoint: string | null;
  };
  raw: {
    list: ProjectListItem;
    detail: DetailResponse | null;
  };
  detailFetchError: string | null;
};

type ExportPayload = {
  source: {
    baseUrl: string;
    listEndpoint: string;
    detailEndpointTemplate: string;
  };
  query: {
    sortBy: SortField;
    order: SortOrder;
    includeDrafts: boolean;
    pageLimit: number;
    startOffset: number;
  };
  stats: {
    fetchedAt: string;
    listRowsFetched: number;
    uniqueProjects: number;
    detailRowsFetched: number;
    detailErrors: number;
    totalCountFromApi: number | null;
  };
  projects: EnrichedProject[];
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s ? s : null;
}

function parseIntArg(args: string[], flag: string, fallback: number): number {
  const i = args.indexOf(flag);
  if (i < 0) return fallback;
  const raw = args[i + 1];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function parseStringArg(args: string[], flag: string): string | null {
  const i = args.indexOf(flag);
  if (i < 0) return null;
  return nonEmptyString(args[i + 1]);
}

function jsonString(value: unknown): string {
  return JSON.stringify(value);
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "user-agent": "hyperscapeai/colosseum-project-pull",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} for ${url}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  return (await res.json()) as T;
}

async function fetchJsonWithRetry<T>(url: string, attempts = 5): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchJson<T>(url);
    } catch (err) {
      lastErr = err;
      await sleep(Math.min(10_000, 400 * 2 ** i));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const count = items.length;
  if (count === 0) return [];
  const out = new Array<R>(count);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, concurrency), count) }, () =>
    (async () => {
      for (;;) {
        const idx = cursor++;
        if (idx >= count) break;
        out[idx] = await worker(items[idx], idx);
      }
    })(),
  );
  await Promise.all(workers);
  return out;
}

function buildListUrl(params: {
  baseUrl: string;
  sortBy: SortField;
  order: SortOrder;
  includeDrafts: boolean;
  limit: number;
  offset: number;
}): string {
  const u = new URL(`${params.baseUrl}/projects/current`);
  u.searchParams.set("sortBy", params.sortBy);
  u.searchParams.set("order", params.order);
  u.searchParams.set("limit", String(params.limit));
  u.searchParams.set("offset", String(params.offset));
  if (params.includeDrafts) {
    u.searchParams.set("includeDrafts", "true");
  }
  return u.toString();
}

function buildDetailUrl(baseUrl: string, slug: string): string {
  return `${baseUrl}/projects/${encodeURIComponent(slug)}`;
}

function enrich(
  baseUrl: string,
  listItem: ProjectListItem,
  detail: DetailResponse | null,
  detailError: string | null,
): EnrichedProject {
  const p = detail?.project;
  const human = Number.isFinite(p?.humanUpvotes as number)
    ? Number(p?.humanUpvotes || 0)
    : Number(listItem.humanUpvotes || 0);
  const agent = Number.isFinite(p?.agentUpvotes as number)
    ? Number(p?.agentUpvotes || 0)
    : Number(listItem.agentUpvotes || 0);
  const tags = Array.isArray(p?.tags) ? p!.tags.filter((t) => typeof t === "string") : [];

  const claim = p?.ownerAgentClaim ?? listItem.ownerAgentClaim ?? null;
  const ownerAgentClaim =
    claim && (claim.xUsername || claim.xProfileImageUrl)
      ? {
          xUsername: nonEmptyString(claim.xUsername) || null,
          xProfileImageUrl: nonEmptyString(claim.xProfileImageUrl) || null,
        }
      : null;

  const detailUrl = detail ? buildDetailUrl(baseUrl, listItem.slug) : null;

  return {
    id: listItem.id,
    name: p?.name ?? listItem.name,
    slug: listItem.slug,
    status: p?.status ?? listItem.status ?? null,
    description: p?.description ?? listItem.description ?? null,
    votes: {
      human,
      agent,
      total: human + agent,
    },
    ownerAgentName: p?.ownerAgentName ?? listItem.ownerAgentName ?? null,
    ownerAgentClaim,
    teamName: p?.teamName ?? listItem.teamName ?? null,
    links: {
      repo: p?.repoLink ?? listItem.repoLink ?? null,
      presentation: p?.presentationLink ?? listItem.presentationLink ?? null,
      liveApp: p?.liveAppLink ?? null,
    },
    socials: {
      twitter: p?.twitterHandle ?? null,
      telegram: p?.telegramHandle ?? null,
    },
    tags,
    solanaIntegration: p?.solanaIntegration ?? null,
    content: {
      problemStatement: p?.problemStatement ?? null,
      technicalApproach: p?.technicalApproach ?? null,
      targetAudience: p?.targetAudience ?? null,
      businessModel: p?.businessModel ?? null,
      competitiveLandscape: p?.competitiveLandscape ?? null,
      futureVision: p?.futureVision ?? null,
      additionalInfo: p?.additionalInfo ?? null,
    },
    timeline: {
      submittedAt: p?.submittedAt ?? listItem.submittedAt ?? null,
      createdAt: p?.createdAt ?? null,
      updatedAt: p?.updatedAt ?? listItem.updatedAt ?? null,
    },
    teamMembers: detail?.teamMembers ?? [],
    sources: {
      listEndpoint: `${baseUrl}/projects/current`,
      detailEndpoint: detailUrl,
    },
    raw: {
      list: listItem,
      detail,
    },
    detailFetchError: detailError,
  };
}

function ensureSqliteSchema(db: Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS colosseum_agent_hackathon_projects (
      id INTEGER PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      status TEXT,
      human_upvotes INTEGER NOT NULL DEFAULT 0,
      agent_upvotes INTEGER NOT NULL DEFAULT 0,
      total_upvotes INTEGER NOT NULL DEFAULT 0,
      owner_agent_name TEXT,
      owner_x_username TEXT,
      owner_x_profile_image_url TEXT,
      team_name TEXT,
      repo_link TEXT,
      presentation_link TEXT,
      live_app_link TEXT,
      twitter_handle TEXT,
      telegram_handle TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      description TEXT,
      solana_integration TEXT,
      submitted_at TEXT,
      created_at TEXT,
      updated_at TEXT,
      team_members_json TEXT NOT NULL DEFAULT '[]',
      list_json TEXT NOT NULL,
      detail_json TEXT,
      raw_json TEXT NOT NULL,
      fetched_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_colosseum_projects_slug
      ON colosseum_agent_hackathon_projects(slug);
    CREATE INDEX IF NOT EXISTS idx_colosseum_projects_status
      ON colosseum_agent_hackathon_projects(status);
    CREATE INDEX IF NOT EXISTS idx_colosseum_projects_total_upvotes
      ON colosseum_agent_hackathon_projects(total_upvotes);
    CREATE INDEX IF NOT EXISTS idx_colosseum_projects_owner
      ON colosseum_agent_hackathon_projects(owner_agent_name);
  `);
}

async function main() {
  const args = process.argv.slice(2);

  const dryRun = args.includes("--dry-run");
  const includeDrafts = !args.includes("--no-drafts");
  const skipDetails = args.includes("--skip-details");

  const outArg = parseStringArg(args, "--out") || "./colosseum-agent-hackathon-projects.json";
  const outPath = path.isAbsolute(outArg) ? outArg : path.resolve(process.cwd(), outArg);

  const sqlitePathArg = parseStringArg(args, "--sqlite-path");
  const sqlitePath = sqlitePathArg
    ? path.isAbsolute(sqlitePathArg)
      ? sqlitePathArg
      : path.resolve(process.cwd(), sqlitePathArg)
    : null;

  const requestedLimit = parseIntArg(args, "--limit", 100);
  const limit = Math.max(1, Math.min(100, requestedLimit));
  const startOffset = Math.max(0, parseIntArg(args, "--start-offset", 0));
  const maxProjects = Math.max(0, parseIntArg(args, "--max-projects", 0));
  const concurrency = Math.max(1, Math.min(32, parseIntArg(args, "--concurrency", 8)));

  const sortByRaw = parseStringArg(args, "--sort-by");
  const sortBy: SortField =
    sortByRaw === "agent_upvotes" || sortByRaw === "total" || sortByRaw === "created_at"
      ? sortByRaw
      : "human_upvotes";

  const orderRaw = parseStringArg(args, "--order");
  const order: SortOrder = orderRaw === "asc" ? "asc" : "desc";

  const baseUrlRaw = parseStringArg(args, "--base-url");
  const baseUrl = baseUrlRaw || DEFAULT_BASE_URL;

  const fetchedAt = new Date().toISOString();
  const listEndpoint = `${baseUrl}/projects/current`;

  if (requestedLimit !== limit) {
    console.log(`[colosseum] Clamped --limit=${requestedLimit} to API max ${limit}`);
  }

  console.log(
    `[colosseum] Pulling projects (sortBy=${sortBy}, order=${order}, includeDrafts=${includeDrafts}, limit=${limit}, offset=${startOffset})`,
  );

  let offset = startOffset;
  let totalCountFromApi: number | null = null;
  const listItems: ProjectListItem[] = [];

  for (;;) {
    const url = buildListUrl({
      baseUrl,
      sortBy,
      order,
      includeDrafts,
      limit,
      offset,
    });

    const page = await fetchJsonWithRetry<ListResponse>(url);

    if (totalCountFromApi === null && Number.isFinite(page.totalCount)) {
      totalCountFromApi = page.totalCount;
    }

    const items = Array.isArray(page.projects) ? page.projects : [];
    if (items.length === 0) break;

    for (const item of items) {
      listItems.push(item);
      if (maxProjects > 0 && listItems.length >= maxProjects) break;
    }

    const pct =
      totalCountFromApi && totalCountFromApi > 0
        ? ((Math.min(listItems.length, totalCountFromApi) / totalCountFromApi) * 100).toFixed(1)
        : "n/a";
    console.log(
      `[colosseum] page offset=${offset} fetched=${items.length} total_fetched=${listItems.length} total≈${totalCountFromApi ?? "?"} (${pct}%)`,
    );

    if (!page.hasMore) break;
    if (maxProjects > 0 && listItems.length >= maxProjects) break;

    offset += items.length;
    await sleep(75);
  }

  // Dedupe by project id while preserving first-seen order.
  const seen = new Set<number>();
  const uniqueList = listItems.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  console.log(`[colosseum] Unique projects: ${uniqueList.length}`);

  let detailRowsFetched = 0;
  let detailErrors = 0;

  const detailResults = skipDetails
    ? uniqueList.map((item) => ({
        item,
        detail: null as DetailResponse | null,
        error: null as string | null,
      }))
    : await mapWithConcurrency(uniqueList, concurrency, async (item, idx) => {
        const url = buildDetailUrl(baseUrl, item.slug);
        try {
          const detail = await fetchJsonWithRetry<DetailResponse>(url);
          detailRowsFetched += 1;
          if ((idx + 1) % Math.max(1, Math.floor(concurrency * 3)) === 0) {
            console.log(`[colosseum] detail ${idx + 1}/${uniqueList.length}`);
          }
          return { item, detail, error: null as string | null };
        } catch (err) {
          detailErrors += 1;
          return {
            item,
            detail: null as DetailResponse | null,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      });

  const projects = detailResults.map((entry) =>
    enrich(baseUrl, entry.item, entry.detail, entry.error),
  );

  const payload: ExportPayload = {
    source: {
      baseUrl,
      listEndpoint,
      detailEndpointTemplate: `${baseUrl}/projects/{slug}`,
    },
    query: {
      sortBy,
      order,
      includeDrafts,
      pageLimit: limit,
      startOffset,
    },
    stats: {
      fetchedAt,
      listRowsFetched: listItems.length,
      uniqueProjects: projects.length,
      detailRowsFetched,
      detailErrors,
      totalCountFromApi,
    },
    projects,
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${jsonString(payload)}\n`, "utf8");
  }

  if (sqlitePath) {
    const db = new Database(sqlitePath, { create: true, strict: true });
    try {
      ensureSqliteSchema(db);
      if (!dryRun) {
        const upsert = db.query(`
          INSERT INTO colosseum_agent_hackathon_projects (
            id, slug, name, status, human_upvotes, agent_upvotes, total_upvotes,
            owner_agent_name, owner_x_username, owner_x_profile_image_url,
            team_name, repo_link, presentation_link, live_app_link, twitter_handle, telegram_handle,
            tags_json, description, solana_integration,
            submitted_at, created_at, updated_at,
            team_members_json, list_json, detail_json, raw_json, fetched_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            slug = excluded.slug,
            name = excluded.name,
            status = excluded.status,
            human_upvotes = excluded.human_upvotes,
            agent_upvotes = excluded.agent_upvotes,
            total_upvotes = excluded.total_upvotes,
            owner_agent_name = excluded.owner_agent_name,
            owner_x_username = excluded.owner_x_username,
            owner_x_profile_image_url = excluded.owner_x_profile_image_url,
            team_name = excluded.team_name,
            repo_link = excluded.repo_link,
            presentation_link = excluded.presentation_link,
            live_app_link = excluded.live_app_link,
            twitter_handle = excluded.twitter_handle,
            telegram_handle = excluded.telegram_handle,
            tags_json = excluded.tags_json,
            description = excluded.description,
            solana_integration = excluded.solana_integration,
            submitted_at = excluded.submitted_at,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            team_members_json = excluded.team_members_json,
            list_json = excluded.list_json,
            detail_json = excluded.detail_json,
            raw_json = excluded.raw_json,
            fetched_at = excluded.fetched_at
        `);

        const tx = db.transaction((rows: EnrichedProject[]) => {
          for (const row of rows) {
            upsert.run(
              row.id,
              row.slug,
              row.name,
              row.status,
              row.votes.human,
              row.votes.agent,
              row.votes.total,
              row.ownerAgentName,
              row.ownerAgentClaim?.xUsername || null,
              row.ownerAgentClaim?.xProfileImageUrl || null,
              row.teamName,
              row.links.repo,
              row.links.presentation,
              row.links.liveApp,
              row.socials.twitter,
              row.socials.telegram,
              jsonString(row.tags),
              row.description,
              row.solanaIntegration,
              row.timeline.submittedAt,
              row.timeline.createdAt,
              row.timeline.updatedAt,
              jsonString(row.teamMembers),
              jsonString(row.raw.list),
              row.raw.detail ? jsonString(row.raw.detail) : null,
              jsonString(row),
              fetchedAt,
            );
          }
        });
        tx(projects);
      }
    } finally {
      db.close(false);
    }
  }

  console.log(
    `[colosseum] Done. unique=${projects.length} detail_ok=${detailRowsFetched} detail_errors=${detailErrors}${dryRun ? " (dry-run)" : ""}`,
  );
  if (!dryRun) {
    console.log(`[colosseum] JSON: ${outPath}`);
    if (sqlitePath) console.log(`[colosseum] SQLite: ${sqlitePath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
