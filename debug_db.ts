import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function debugData() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  console.log('--- USERS ---');
  const users = await pool.query('SELECT id, email, name FROM users');
  console.log(JSON.stringify(users.rows, null, 2));

  console.log('--- VOUCHERS (Space Check) ---');
  const vouchers = await pool.query('SELECT code, user_email, LENGTH(user_email) as len, LENGTH(TRIM(user_email)) as trimmed_len FROM vouchers WHERE user_email IS NOT NULL');
  console.log(JSON.stringify(vouchers.rows, null, 2));

  console.log('--- VOUCHERS (Universal user_email IS NULL) ---');
  const universal = await pool.query('SELECT id, code, is_active, usage_limit, usage_count, min_user_spending, user_email FROM vouchers WHERE user_email IS NULL');
  console.log(JSON.stringify(universal.rows, null, 2));

  console.log('--- VOUCHERS (Active universal only) ---');
  const universalActive = await pool.query('SELECT id, code, is_active, usage_limit, usage_count, min_user_spending, is_registration FROM vouchers WHERE user_email IS NULL AND is_active = 1');
  console.log(JSON.stringify(universalActive.rows, null, 2));

  console.log('--- used_vouchers (all) ---');
  const used = await pool.query('SELECT id, user_email, voucher_code, order_id, created_at FROM used_vouchers');
  console.log(JSON.stringify(used.rows, null, 2));

  const emailToTest = universalActive.rows[0]?.user_email;
  void emailToTest;

  process.exit(0);
}

debugData().catch(err => {
  console.error(err);
  process.exit(1);
});
