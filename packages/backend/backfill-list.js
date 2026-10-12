import 'dotenv/config';
import mongoose from 'mongoose';
import List from './list.js';
import Task from './task.js';

/* ONE-TIME database migration script for multiple task lists.
 * Run with node backfill-list.js from the backend directory with .env in it. */

async function backfillTasks() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await mongoose.connect(process.env.MONGODB_URI);

  // finds the list named My Tasks, or creates it if it doesn't exist
  const defaultList = await List.findOneAndUpdate(
    { name: 'My Tasks' },
    { $setOnInsert: { name: 'My Tasks' } },
    { upsert: true, new: true }
  );

  // finds tasks with no listId and sets their listId to My Tasks's listId
  const result = await Task.updateMany(
    { $or: [{ listId: { $exists: false } }, { listId: null }] },
    { $set: { listId: defaultList._id } }
  );

  // logs number of tasks updated
  console.log(
    `Assigned ${result.modifiedCount} tasks to "${defaultList.name}".`
  );
}

backfillTasks()
  .catch((error) => {
    console.error('Could not backfill tasks:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
