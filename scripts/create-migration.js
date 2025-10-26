// scripts/create-migration.js
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ES Module equivalent for __dirname ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// -----------------------------------------

// Load environment variables from the .env file in the project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Check if DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error('🔴 Error: DATABASE_URL not found. Make sure your .env file is set up correctly.');
  process.exit(1);
}

// Generate a timestamp in the format YYYYMMDDHHMMSS
const now = new Date();
const timestamp = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
  String(now.getHours()).padStart(2, '0'),
  String(now.getMinutes()).padStart(2, '0'),
  String(now.getSeconds()).padStart(2, '0'),
].join('');

const migrationName = `auto_${timestamp}`;
const command = `npx prisma migrate dev --name ${migrationName}`;

try {
  console.log(`⚪ Running migration command: ${command}`);
  execSync(command, { stdio: 'inherit' });
  console.log('🟢 Migration created successfully.');
} catch (error) {
  console.error('🔴 Error creating migration:', error.message);
  process.exit(1);
}