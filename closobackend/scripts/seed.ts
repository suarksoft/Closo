import { Pool } from "pg";
import { hash } from "bcryptjs";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/monadblitz",
  });

  const sellerPass = await hash("seller123", 10);
  const businessPass = await hash("business123", 10);
  const adminPass = await hash("admin123", 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const users = await client.query<{ id: string; email: string }>(
      `INSERT INTO users (name, email, password_hash, role, wallet_address, company_name)
       VALUES
        ('Demo Seller', 'seller@monadblitz.dev', $1, 'seller', '0xseller000000000000000000000000000000000001', NULL),
        ('Demo Business', 'business@monadblitz.dev', $2, 'business', '0xbusiness000000000000000000000000000000001', 'Acme Labs'),
        ('Demo Admin', 'admin@monadblitz.dev', $3, 'admin', '0xadmin000000000000000000000000000000000001', NULL)
       ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
       RETURNING id, email`,
      [sellerPass, businessPass, adminPass],
    );

    const sellerId = users.rows.find((u) => u.email === "seller@monadblitz.dev")?.id;
    const businessId = users.rows.find((u) => u.email === "business@monadblitz.dev")?.id;
    if (!sellerId || !businessId) throw new Error("Seed users not found");

    const products = await client.query<{ id: string; title: string }>(
      `INSERT INTO products (business_id, title, description, category, price, commission_type, commission_value, website)
       VALUES
        ($1, 'CloudSync Pro', 'Enterprise file sync for distributed teams', 'Productivity', 49, 'percent', 30, 'https://cloudsync.example.com'),
        ($1, 'InsightAI', 'Predictive analytics assistant for SaaS ops', 'Analytics', 99, 'percent', 25, 'https://insightai.example.com')
       ON CONFLICT DO NOTHING
       RETURNING id, title`,
      [businessId],
    );

    const productList =
      products.rows.length > 0
        ? products.rows
        : (
            await client.query<{ id: string; title: string }>(
              "SELECT id, title FROM products WHERE business_id = $1 ORDER BY created_at DESC LIMIT 2",
              [businessId],
            )
          ).rows;

    await client.query(
      `INSERT INTO leads (source, company_name, contact_name, contact_channel, location, score, status)
       VALUES
        ('google-business', 'TechFlow Solutions', 'Alice Brown', 'email', 'San Francisco, CA', 92, 'new'),
        ('google-business', 'GreenLeaf Marketing', 'Bob Stone', 'whatsapp', 'Austin, TX', 87, 'new'),
        ('google-business', 'CloudNine Analytics', 'Eve King', 'email', 'New York, NY', 84, 'new')
       ON CONFLICT DO NOTHING`,
    );

    const lead = await client.query<{ id: string }>("SELECT id FROM leads ORDER BY score DESC LIMIT 1");
    const firstProduct = productList[0];
    if (lead.rows[0] && firstProduct) {
      await client.query(
        `INSERT INTO lead_assignments (lead_id, seller_id, product_id, state)
         VALUES ($1, $2, $3, 'assigned')
         ON CONFLICT (lead_id, seller_id, product_id) DO NOTHING`,
        [lead.rows[0].id, sellerId, firstProduct.id],
      );
    }

    await client.query("COMMIT");
    // eslint-disable-next-line no-console
    console.log("Seed completed");
    // eslint-disable-next-line no-console
    console.log("Demo accounts:");
    // eslint-disable-next-line no-console
    console.log("- seller@monadblitz.dev / seller123");
    // eslint-disable-next-line no-console
    console.log("- business@monadblitz.dev / business123");
    // eslint-disable-next-line no-console
    console.log("- admin@monadblitz.dev / admin123");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
