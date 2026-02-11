import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL in .env file');
  process.exit(1);
}

const client = new Client({
  connectionString: dbUrl,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('🔌 Connected to database');

    const sqlPath = path.resolve(__dirname, '../../sql/25_create_signed_waiver.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Running migration: 25_create_signed_waiver.sql');
    await client.query(sql);

    console.log('✅ Migration completed successfully');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
