import { neon } from '@neondatabase/serverless';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  'use server';
  const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
  const { id } = await context.params;

  try {
    const body = await req.json();

    const result = await sql`
      UPDATE shelters
      SET
        title = ${body.title},
        description = ${body.description},
        numtotbeds = ${body.numtotbeds},
        numopenbeds = ${body.numopenbeds},
        address = ${body.address},
        longitude = ${body.longitude},
        latitude = ${body.latitude},
        phone = ${body.phone},
        families = ${body.families},
        single_women = ${body.single_women},
        single_men = ${body.single_men},
        domestic_violence = ${body.domestic_violence},
        pet_friendly = ${body.pet_friendly},
        age_min = ${body.age_min},
        age_max = ${body.age_max},
        wheelchair_accessible = ${body.wheelchair_accessible},
        website = ${body.website}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (result.length === 0) return Response.json({ error: 'Shelter not found' }, { status: 404 });
    return Response.json(result[0], { status: 200 });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Failed to update shelter' }, { status: 400 });
  }
}
