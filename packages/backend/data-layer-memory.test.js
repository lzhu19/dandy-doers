import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import List from './list.js';
import {
  addList,
  deleteList,
  findListById,
  getLists,
  updateListName,
} from './list-services.js';
import Task from './task.js';
import {
  addTask,
  archiveTask,
  deleteTask,
  findTaskById,
  findTaskByName,
  getArchivedTasks,
  getDeletedTasks,
  getTasks,
  permanentlyDeleteTask,
  reorderTasks,
  restoreArchivedTask,
  restoreDeletedTask,
  updateDeadline,
  updateTask,
  updateTaskListId,
} from './task-services.js';
import User from './user.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await User.init();
});

beforeEach(async () => {
  await Promise.all([
    List.deleteMany({}),
    Task.deleteMany({}),
    User.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

async function createList(name = 'School') {
  return addList({ name });
}

async function createTask(listId, fields = {}) {
  return addTask({ name: 'Homework', listId, ...fields });
}

describe('List model and services with MongoDB', () => {
  it('creates lists with trimmed names and retrieves them', async () => {
    const list = await addList({ name: '  School  ' });

    expect(list.name).toBe('School');
    expect((await findListById(list._id)).name).toBe('School');
    expect(await getLists()).toHaveLength(1);
  });

  it('validates required list names', async () => {
    await expect(List.create({})).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('returns null when a list does not exist', async () => {
    const missingId = new mongoose.Types.ObjectId();

    await expect(findListById(missingId)).resolves.toBeNull();
    await expect(
      updateListName(missingId, { name: 'Renamed' })
    ).resolves.toBeNull();
    await expect(deleteList(missingId)).resolves.toBeNull();
  });

  it('updates a list name', async () => {
    const list = await createList();

    const updatedList = await updateListName(list._id, { name: 'Work' });

    expect(updatedList.name).toBe('Work');
    expect((await findListById(list._id)).name).toBe('Work');
  });

  it('deletes a list and its tasks', async () => {
    const list = await createList();
    await createTask(list._id);

    const deletedList = await deleteList(list._id);

    expect(deletedList._id.toString()).toBe(list._id.toString());
    await expect(findListById(list._id)).resolves.toBeNull();
    expect(await Task.countDocuments({ listId: list._id })).toBe(0);
  });
});

describe('Task model and services with MongoDB', () => {
  it('applies task defaults, casts deadline dates, and creates timestamps', async () => {
    const list = await createList();

    const task = await createTask(list._id, {
      deadline: new Date('2030-01-02T03:04:00.000Z').toISOString(),
    });

    expect(task.archived).toBe(false);
    expect(task.deleted).toBe(false);
    expect(task.position).toBe(0);
    expect(task.notes).toBe('');
    expect(task.deadline).toBeInstanceOf(Date);
    expect(task.createdAt).toBeInstanceOf(Date);
    expect(task.updatedAt).toBeInstanceOf(Date);
  });

  it('validates required task fields', async () => {
    await expect(Task.create({})).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('gets tasks sorted by position and searches by exact name', async () => {
    const list = await createList();
    await createTask(list._id, { name: 'Second', position: 2 });
    await createTask(list._id, { name: 'First', position: 1 });

    await expect(getTasks()).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'First' }),
        expect.objectContaining({ name: 'Second' }),
      ])
    );
    await expect(getTasks()).resolves.toMatchObject([
      { name: 'First' },
      { name: 'Second' },
    ]);
    await expect(findTaskByName('First')).resolves.toMatchObject([
      { name: 'First' },
    ]);
    await expect(getTasks('Second')).resolves.toMatchObject([
      { name: 'Second' },
    ]);
  });

  it('finds tasks by id and returns null for missing tasks', async () => {
    const list = await createList();
    const task = await createTask(list._id);

    await expect(findTaskById(task._id)).resolves.toMatchObject({
      name: 'Homework',
    });
    await expect(
      findTaskById(new mongoose.Types.ObjectId())
    ).resolves.toBeNull();
  });

  it('updates task name and notes without replacing other fields', async () => {
    const list = await createList();
    const task = await createTask(list._id, { notes: 'Original notes' });

    const updatedTask = await updateTask(task._id, {
      name: 'Project',
      notes: 'Updated notes',
    });

    expect(updatedTask.name).toBe('Project');
    expect(updatedTask.notes).toBe('Updated notes');
    expect(updatedTask.listId.toString()).toBe(list._id.toString());
    await expect(
      updateTask(new mongoose.Types.ObjectId(), { name: 'Missing' })
    ).resolves.toBeNull();
  });

  it('sets and clears a task deadline', async () => {
    const list = await createList();
    const task = await createTask(list._id);
    const deadline = new Date('2030-01-02T03:04:00.000Z');

    await expect(updateDeadline(task._id, deadline)).resolves.toMatchObject({
      deadline,
    });
    await expect(updateDeadline(task._id, null)).resolves.toMatchObject({
      deadline: null,
    });
    await expect(
      updateDeadline(new mongoose.Types.ObjectId(), deadline)
    ).resolves.toBeNull();
  });

  it('archives tasks, clears deadlines, and restores archived tasks', async () => {
    const list = await createList();
    const task = await createTask(list._id, {
      deadline: new Date('2030-01-02T03:04:00.000Z'),
    });

    const archivedTask = await archiveTask(task._id);
    expect(archivedTask.archived).toBe(true);
    expect(archivedTask.deadline).toBeNull();
    await expect(getArchivedTasks()).resolves.toMatchObject([
      { _id: task._id, archived: true },
    ]);

    const restoredTask = await restoreArchivedTask(task._id);
    expect(restoredTask.archived).toBe(false);
    await expect(getArchivedTasks()).resolves.toHaveLength(0);
    await expect(
      archiveTask(new mongoose.Types.ObjectId())
    ).resolves.toBeNull();
    await expect(
      restoreArchivedTask(new mongoose.Types.ObjectId())
    ).resolves.toBeNull();
  });

  it('soft-deletes tasks, clears deadlines, and restores deleted tasks', async () => {
    const list = await createList();
    const task = await createTask(list._id, {
      deadline: new Date('2030-01-02T03:04:00.000Z'),
    });

    const deletedTask = await deleteTask(task._id);
    expect(deletedTask.deleted).toBe(true);
    expect(deletedTask.deadline).toBeNull();
    await expect(getDeletedTasks()).resolves.toMatchObject([
      { _id: task._id, deleted: true },
    ]);

    const restoredTask = await restoreDeletedTask(task._id);
    expect(restoredTask.deleted).toBe(false);
    await expect(getDeletedTasks()).resolves.toHaveLength(0);
    await expect(deleteTask(new mongoose.Types.ObjectId())).resolves.toBeNull();
    await expect(
      restoreDeletedTask(new mongoose.Types.ObjectId())
    ).resolves.toBeNull();
  });

  it('permanently deletes only soft-deleted tasks', async () => {
    const list = await createList();
    const deletedTask = await createTask(list._id, { deleted: true });
    const activeTask = await createTask(list._id, { name: 'Active' });

    await expect(permanentlyDeleteTask(deletedTask._id)).resolves.toMatchObject(
      { name: 'Homework' }
    );
    await expect(permanentlyDeleteTask(activeTask._id)).resolves.toBeNull();
    expect(await Task.countDocuments()).toBe(1);
  });

  it('reorders every active task and rejects an incomplete task list', async () => {
    const list = await createList();
    const first = await createTask(list._id, { name: 'First', position: 0 });
    const second = await createTask(list._id, { name: 'Second', position: 1 });

    const reordered = await reorderTasks(list._id, [second._id, first._id]);

    expect(reordered.map((task) => task.name)).toEqual(['Second', 'First']);
    await expect(reorderTasks(list._id, [first._id])).rejects.toThrow(
      'Task IDs must represent every task in the list exactly once.'
    );
  });

  it('moves a task to another list', async () => {
    const sourceList = await createList('Source');
    const targetList = await createList('Target');
    const task = await createTask(sourceList._id);

    const movedTask = await updateTaskListId(task._id, targetList._id);

    expect(movedTask.listId.toString()).toBe(targetList._id.toString());
    await expect(
      updateTaskListId(new mongoose.Types.ObjectId(), targetList._id)
    ).resolves.toBeNull();
  });
});

describe('User model with MongoDB', () => {
  it('persists users with trimmed usernames', async () => {
    const user = await User.create({
      username: '  dandy  ',
      hashedPassword: 'hashed-password',
    });

    await expect(User.findOne({ username: 'dandy' })).resolves.toMatchObject({
      _id: user._id,
      username: 'dandy',
    });
  });

  it('requires a username and hashed password', async () => {
    await expect(User.create({})).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('enforces unique usernames', async () => {
    await User.create({ username: 'dandy', hashedPassword: 'first-hash' });

    await expect(
      User.create({ username: 'dandy', hashedPassword: 'second-hash' })
    ).rejects.toMatchObject({ code: 11000 });
  });
});
