import 'dotenv/config';
import mongoose from 'mongoose';
import Task from './task.js';

/* ONE-TIME database migration script for task creation timestamps.
 * Run with node backfill-tasks.js from the backend directory with .env in it. */

async function backfillTasks() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const backfillTime = new Date();
  const result = await Task.collection.updateMany(
    { $or: [{ createdAt: { $exists: false } }, { createdAt: null }] },
    { $set: { createdAt: backfillTime } }
  );

  console.log(
    `Set createdAt on ${result.modifiedCount} tasks to ${backfillTime.toISOString()}.`
  );
}

backfillTasks()
  .catch((error) => {
    console.error('Could not backfill task timestamps:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());