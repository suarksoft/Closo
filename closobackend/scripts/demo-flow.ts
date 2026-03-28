import { config as dotenvConfig } from "dotenv";

dotenvConfig();
const baseUrl = process.env.API_BASE_URL ?? "http://localhost:4000";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) ${path}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function run() {
  const sellerLogin = await api<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "seller@monadblitz.dev", password: "seller123" }),
  });

  const businessLogin = await api<{ accessToken: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "business@monadblitz.dev", password: "business123" }),
  });

  const myLeads = await api<Array<{ id: string; leadId: string; productId: string }>>("/leads/mine", {
    headers: { Authorization: `Bearer ${sellerLogin.accessToken}` },
  });
  if (!myLeads.length) throw new Error("No lead assignments found. Run seed first.");

  const sale = await api<{ id: string }>("/sales", {
    method: "POST",
    headers: { Authorization: `Bearer ${sellerLogin.accessToken}` },
    body: JSON.stringify({ leadAssignmentId: myLeads[0].id, amount: 49 }),
  });

  const verified = await api<{ payout: { txHash: string } }>("/sales/verify", {
    method: "POST",
    headers: { Authorization: `Bearer ${businessLogin.accessToken}` },
    body: JSON.stringify({ saleId: sale.id, triggerPayout: true }),
  });

  // eslint-disable-next-line no-console
  console.log("Demo flow success. Monad tx:", verified.payout?.txHash);
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
