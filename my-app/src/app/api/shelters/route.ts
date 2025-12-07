export async function POST(req: Request) {
  'use server';
  const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
  try {
    const data = await req.json();
    // Destructure and sanitize fields
    const {
      title,
      description,
      numTotBeds,
      numOpenBeds,
      address,
      longitude,
      latitude,
      phone,
      families,
      single_women,
      single_men,
      domestic_violence,
      pet_friendly,
      age_min,
      age_max,
      wheelchair_accessible,
      website
    } = data;

    // Insert into shelters table
    const result = await sql`
      INSERT INTO shelters (
        title, description, numTotBeds, numOpenBeds, address, longitude, latitude, phone, families, single_women, single_men, domestic_violence, pet_friendly, age_min, age_max, wheelchair_accessible, website
      ) VALUES (
        ${title}, ${description}, ${numTotBeds}, ${numOpenBeds}, ${address}, ${longitude}, ${latitude}, ${phone}, ${families}, ${single_women}, ${single_men}, ${domestic_violence}, ${pet_friendly}, ${age_min}, ${age_max}, ${wheelchair_accessible}, ${website}
      ) RETURNING *;
    `;
    return Response.json(result[0], { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message || 'Failed to add shelter' }, { status: 400 });
  }
}
import { neon } from '@neondatabase/serverless';

export async function GET() {
  'use server';
  const sql = neon(process.env.COS_SHELTER_CONNECT_DATABASE_URL!);
  // Query all shelters from the database
  const result = await sql`SELECT * FROM shelters`;
  // Return as JSON response
  return Response.json(result);
}