import { rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Set up isolated test data directory
const TEST_DATA_DIR = join(import.meta.dir, '.test-data');

console.log(`\n🧪 Test Setup`);
console.log(`   DATA_DIR: ${TEST_DATA_DIR}`);

// Clean and recreate the test data directory
try {
    rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    console.log(`   ✓ Cleaned test data directory`);
} catch {
    // Directory may not exist
}
mkdirSync(TEST_DATA_DIR, { recursive: true });
console.log(`   ✓ Created fresh test data directory\n`);

// Set environment variable before any tests import config
process.env.DATA_DIR = TEST_DATA_DIR;
