/**
 * Migration: Unset shareToken where it is explicitly null
 * (converts null→missing, making the sparse unique index work correctly)
 * Run: node scripts/fixNullShareTokens.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const col = db.collection('documents');

  // 1. Remove the old index (whether sparse or not)
  try {
    await col.dropIndex('shareToken_1');
    console.log('✅ Dropped shareToken_1 index');
  } catch (e) {
    console.log('ℹ️  No existing shareToken_1 index to drop');
  }

  // 2. Unset shareToken on all docs where it is null (not just absent)
  const result = await col.updateMany(
    { shareToken: null },
    { $unset: { shareToken: '', qrCode: '', shareExpiresAt: '', expiresAt: '', aiSummary: '', aiSummaryAt: '' } }
  );
  console.log(`✅ Unset null fields on ${result.modifiedCount} documents`);

  // 3. Recreate the sparse unique index
  await col.createIndex({ shareToken: 1 }, { unique: true, sparse: true, name: 'shareToken_1' });
  console.log('✅ Recreated shareToken index (unique + sparse)');

  await mongoose.disconnect();
  console.log('Done. Upload should now work without duplicate key errors.');
}

fix().catch(err => { console.error('Migration failed:', err.message); process.exit(1); });
