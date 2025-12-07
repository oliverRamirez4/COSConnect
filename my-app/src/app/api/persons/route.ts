import { neon } from '@neondatabase/serverless';

// GET /api/persons?q=Jane
export async function GET(req: Request) {
  try {
    const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
    const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
    if (!q) {
      const rows = await sql`SELECT id, full_name, phone, email, date_of_birth FROM persons ORDER BY full_name ASC LIMIT 25;`;
      return Response.json(rows);
    }
    const like = `%${q}%`;
    const rows = await sql`SELECT id, full_name, phone, email, date_of_birth FROM persons WHERE full_name ILIKE ${like} ORDER BY full_name ASC LIMIT 25;`;
    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

// POST /api/persons
// body: { full_name: string, phone?: string, email?: string, date_of_birth?: string }
export async function POST(req: Request) {
  try {
    const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
    const body = await req.json();
    const full_name = String(body?.full_name ?? '').trim();
    const phone = body?.phone ?? null;
    const email = body?.email ?? null;
    const date_of_birth = body?.date_of_birth ?? null; // Expect 'YYYY-MM-DD'
    if (!full_name) {
      return Response.json({ error: 'full_name is required' }, { status: 400 });
    }
    // Optional: dedupe by name+phone/email
    const existing = await sql`SELECT id FROM persons WHERE full_name = ${full_name} AND (phone = ${phone} OR email = ${email}) LIMIT 1;`;
    if (existing[0]?.id) {
      return Response.json({ id: existing[0].id }, { status: 200 });
    }
    const inserted = await sql`
      INSERT INTO persons (full_name, phone, email, date_of_birth)
      VALUES (${full_name}, ${phone}, ${email}, ${date_of_birth})
      RETURNING id, full_name, phone, email, date_of_birth;
    `;
    return Response.json(inserted[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
