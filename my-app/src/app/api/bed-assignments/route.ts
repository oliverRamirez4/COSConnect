import { neon } from '@neondatabase/serverless';

// GET /api/bed-assignments?shelterId=123
export async function GET(req: Request) {
  try {
    const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
    const shelterIdParam = new URL(req.url).searchParams.get("shelterId");
    const shelterId = shelterIdParam ? Number(shelterIdParam) : null;
    if (!shelterId) {
      return Response.json({ error: "shelterId required" }, { status: 400 });
    }

    const rows = await sql`
      SELECT ba.id, p.id as person_id, p.full_name, ba.bed_number, ba.assigned_at
      FROM bed_assignments ba
      JOIN persons p ON p.id = ba.person_id
      WHERE ba.shelter_id = ${shelterId} AND ba.status = 'active' AND ba.released_at IS NULL
      ORDER BY ba.assigned_at DESC;
    `;

    return Response.json(rows);
  } catch (err: any) {
    return Response.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

// POST /api/bed-assignments (assign)
// body: { shelterId: number, personName: string, bedNumber?: number, notes?: string }
export async function POST(req: Request) {
  try {
    const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
    const body = await req.json();
    const shelterId = body?.shelterId ? Number(body.shelterId) : null;
    const personName = String(body?.personName ?? "").trim();
    const personIdBody = body?.personId ? Number(body.personId) : null;
    const bedNumber = body?.bedNumber ?? null;
    const notes = body?.notes ?? null;

    if (!shelterId || (!personIdBody && !personName)) {
      return Response.json({ error: "shelterId and personId or personName are required" }, { status: 400 });
    }

    // Resolve personId: prefer provided personId; otherwise find or create by name
    let personId = personIdBody ?? null;
    if (!personId) {
      const personLookup = await sql`SELECT id FROM persons WHERE full_name = ${personName} LIMIT 1;`;
      personId =
        personLookup[0]?.id ??
        (await sql`INSERT INTO persons (full_name) VALUES (${personName}) RETURNING id;`)[0].id;
    }

    // Prevent duplicate active assignment for the same person
    const active = await sql`
      SELECT id FROM bed_assignments WHERE person_id = ${personId} AND status = 'active' AND released_at IS NULL LIMIT 1;
    `;
    if (active[0]) {
      return Response.json({ error: "Person already has an active assignment" }, { status: 409 });
    }

    // Insert new active assignment
    const inserted = await sql`
      INSERT INTO bed_assignments (shelter_id, person_id, bed_number, notes, status, released_at)
      VALUES (${shelterId}, ${personId}, ${bedNumber}, ${notes}, 'active', NULL)
      RETURNING id, shelter_id, person_id, bed_number, assigned_at;
    `;

    return Response.json(inserted[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

// PUT /api/bed-assignments (release)
// body: { shelterId: number, personName?: string, personId?: number, assignmentId?: number }
export async function PUT(req: Request) {
  try {
    const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
    const body = await req.json();
    const shelterId = body?.shelterId ? Number(body.shelterId) : null;
    const personIdBody = body?.personId ? Number(body.personId) : null;
    const personName = String(body?.personName ?? "").trim();
    const assignmentIdBody = body?.assignmentId ? Number(body.assignmentId) : null;

    if (!shelterId) {
      return Response.json({ error: "shelterId required" }, { status: 400 });
    }

    let targetAssignmentId: number | null = assignmentIdBody ?? null;

    if (!targetAssignmentId) {
      let pid = personIdBody;
      if (!pid && personName) {
        const res = await sql`SELECT id FROM persons WHERE full_name = ${personName} LIMIT 1;`;
        pid = res[0]?.id ?? null;
      }
      if (!pid) {
        return Response.json({ error: "personId or personName required" }, { status: 400 });
      }

      const active = await sql`
        SELECT id FROM bed_assignments
        WHERE shelter_id = ${shelterId} AND person_id = ${pid} AND status = 'active' AND released_at IS NULL
        LIMIT 1;
      `;
      targetAssignmentId = active[0]?.id ?? null;
    }

    if (!targetAssignmentId) {
      return Response.json({ error: "Active assignment not found" }, { status: 404 });
    }

    const updated = await sql`
      UPDATE bed_assignments
      SET status = 'released', released_at = NOW()
      WHERE id = ${targetAssignmentId}
      RETURNING id, shelter_id, person_id, bed_number, assigned_at, released_at, status;
    `;

    return Response.json(updated[0]);
  } catch (err: any) {
    return Response.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
