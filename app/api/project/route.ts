import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../chatgpt-auth";

export const dynamic = "force-dynamic";
const MAX_PROJECT_BYTES = 10 * 1024 * 1024;
const noStore = { "Cache-Control": "private, no-store" };
type ProjectRow = { object_key: string; revision: number; updated_at: string };

function reply(value: unknown, status = 200) {
  return Response.json(value, { status, headers: noStore });
}
async function userKey(userId: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(userId));
  return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, "0")).join("");
}
async function currentRow(userId: string) {
  return env.DB!.prepare("SELECT object_key, revision, updated_at FROM projects WHERE user_id = ?")
    .bind(userId).first<ProjectRow>();
}
function validProject(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const project = value as { pages?: unknown; activePageId?: unknown };
  if (!Array.isArray(project.pages) || project.pages.length < 1 || project.pages.length > 100 || typeof project.activePageId !== "string") return false;
  return project.pages.every(page => page && typeof page === "object" &&
    typeof page.id === "string" && typeof page.title === "string" &&
    typeof page.pageHeights === "object" && Array.isArray(page.elements) && page.elements.length <= 5000);
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "Přihlaste se pro přístup k uloženým stránkám." }, 401);
  if (!env.DB || !env.BUCKET) return reply({ error: "Online úložiště není dostupné." }, 503);
  try {
    const account = { displayName: user.displayName, email: user.email, key: await userKey(user.userId) };
    // If a concurrent save replaced the object between reading D1 and R2, retry the pointer.
    for (let attempt = 0; attempt < 2; attempt++) {
      const row = await currentRow(user.userId);
      if (!row) return reply({ account, project: null, revision: 0 });
      const object = await env.BUCKET.get(row.object_key);
      if (!object) continue;
      const project: unknown = JSON.parse(await object.text());
      if (!validProject(project)) throw new Error("Invalid stored project");
      return reply({ account, project, revision: row.revision, updatedAt: row.updated_at });
    }
    return reply({ error: "Uložený projekt se nepodařilo načíst. Zkuste to znovu." }, 503);
  } catch (error) {
    console.error("Project read failed", error);
    return reply({ error: "Online projekt se nepodařilo načíst. Místní kopie zůstala zachována." }, 503);
  }
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: "Přihlaste se pro uložení na účet." }, 401);
  if (!env.DB || !env.BUCKET) return reply({ error: "Online úložiště není dostupné." }, 503);
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin || !request.headers.get("content-type")?.startsWith("application/json")) {
    return reply({ error: "Neplatný požadavek." }, 403);
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_PROJECT_BYTES) return reply({ error: "Projekt je příliš velký. Limit online ukládání je 10 MB." }, 413);
  let body: { project?: unknown; revision?: unknown };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PROJECT_BYTES) return reply({ error: "Projekt je příliš velký. Limit online ukládání je 10 MB." }, 413);
    body = JSON.parse(text);
  } catch { return reply({ error: "Projekt se nepodařilo přečíst." }, 400); }
  if (!validProject(body.project) || !Number.isSafeInteger(body.revision) || (body.revision as number) < 0) {
    return reply({ error: "Projekt nemá platný formát." }, 400);
  }
  let objectKey = "";
  let committed = false;
  try {
    const revision = body.revision as number;
    const existing = await currentRow(user.userId);
    if ((existing?.revision ?? 0) !== revision) return reply({ error: "Na účtu je novější verze projektu. Načtěte ji před dalším uložením." }, 409);
    objectKey = `projects/${await userKey(user.userId)}/${crypto.randomUUID()}.json`;
    await env.BUCKET.put(objectKey, JSON.stringify(body.project), { httpMetadata: { contentType: "application/json" } });
    const updatedAt = new Date().toISOString();
    const saved = revision === 0
      ? await env.DB.prepare("INSERT INTO projects (user_id, object_key, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(user_id) DO NOTHING RETURNING revision")
          .bind(user.userId, objectKey, updatedAt).first<{ revision: number }>()
      : await env.DB.prepare("UPDATE projects SET object_key = ?, revision = revision + 1, updated_at = ? WHERE user_id = ? AND revision = ? RETURNING revision")
          .bind(objectKey, updatedAt, user.userId, revision).first<{ revision: number }>();
    if (!saved) {
      await env.BUCKET.delete(objectKey);
      return reply({ error: "Na účtu je novější verze projektu. Načtěte ji před dalším uložením." }, 409);
    }
    committed = true;
    if (existing) await env.BUCKET.delete(existing.object_key).catch(() => {});
    return reply({ revision: saved.revision, updatedAt });
  } catch (error) {
    if (objectKey && !committed) await env.BUCKET.delete(objectKey).catch(() => {});
    console.error("Project save failed", error);
    return reply({ error: "Projekt se nepodařilo uložit na účet. Místní kopie zůstává v prohlížeči." }, 503);
  }
}
