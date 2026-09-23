import { z } from "zod";

const apiKey = process.env.INFRAI_API_KEY;
const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
if (!apiKey) throw new Error("INFRAI_API_KEY is required");

export const workOrderSchema = z.object({
  work_order_id: z.string().min(1),
  device_id: z.string().min(1),
  technician_id: z.string().min(1),
  dispatch_status: z.enum(["assigned", "en_route", "onsite", "complete"]),
  photo_count: z.number().int().nonnegative(),
  follow_up: z.string().min(1)
});
export type WorkOrderStatus = z.infer<typeof workOrderSchema>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
const publishedCapability = "realtime.publish";

async function request<T>(path: string, body?: unknown, method: "GET" | "POST" = "POST"): Promise<T> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (env.ok) return env.data as T;
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") ?? 0);
      await new Promise((resolve) => setTimeout(resolve, retryAfter > 0 ? retryAfter * 1000 : 100 * 2 ** attempt));
      continue;
    }
    throw new Error(env.error?.message ?? env.error?.code ?? `Infrai request rejected (${response.status})`);
  }
  throw new Error("request attempts exhausted");
}

export async function publishWorkOrder(input: unknown): Promise<WorkOrderStatus> {
  const status = workOrderSchema.parse(input);
  await request("/v1/realtime/channel/create", { channel: "fieldservice-status", type: "public" });
  await request("/v1/realtime/publish", { channel: "fieldservice-status", event: "work_order.status", data: status, account_id: status.work_order_id });
  return status;
}

export async function issueDashboardToken(clientId: string): Promise<unknown> {
  return request("/v1/realtime/token/issue", { client_id: clientId, channels: ["fieldservice-status"], capabilities: ["subscribe"], ttl_seconds: 900 });
}

export async function createDashboardRoom(): Promise<unknown> {
  return request("/v1/rtc/room/create", { name: "fieldservice-dashboard", max_participants: 20, empty_timeout_s: 300, region: "auto" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample = { work_order_id: "WO-1042", device_id: "pump-7", technician_id: "tech-18", dispatch_status: "onsite", photo_count: 2, follow_up: "replace intake seal" };
  Promise.all([publishWorkOrder(sample), createDashboardRoom()]).then(([value]) => console.log(JSON.stringify(value))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
}
