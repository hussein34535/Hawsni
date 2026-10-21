require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Missing SUPABASE_DB_URL (or DATABASE_URL).');
    console.error('Usage: $env:SUPABASE_DB_URL="postgresql://..."; node scripts/apply_rls.js');
    process.exit(1);
}

async function main() {
    const sqlPath = path.join(__dirname, '..', 'migrations', '016_lockdown_public_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    try {
        await client.query(sql);
        console.log('RLS lockdown applied successfully.');
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error('RLS migration failed:', error.message);
    process.exit(1);
});
