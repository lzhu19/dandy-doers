// unit tests for task-services.js
import { afterEach, describe, expect, it } from '@jest/globals';
import mockingoose from 'mockingoose';
import Task from './task.js';
import {
  getTasks,
  findTaskById,
  findTaskByName,
  addTask,
  updateTask,
  deleteTask,
  archiveTask,
  getArchivedTasks,
  restoreArchivedTask,
  getDeletedTasks,
  restoreDeletedTask,
} from './task-services.js';

const taskId = '507f1f77bcf86cd799439011';
const taskName = 'Write unit tests';
const listId = '507f191e810c19729de860ea';
const sampleTask = {
  _id: taskId,
  name: taskName,
  listId,
  archived: false,
  deleted: false,
};
const sampleArchivedTask = { ...sampleTask, archived: true };
const sampleDeletedTask = { ...sampleTask, deleted: true };

afterEach(() => {
  mockingoose.resetAll();
});

describe('getTasks', () => {
  it('returns all tasks when no name is provided', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({});
      return [sampleTask];
    }, 'find');

    const tasks = await getTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe(taskName);
  });

  it('returns an empty array when no tasks exist', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({});
      return [];
    }, 'find');

    const tasks = await getTasks();

    expect(tasks).toEqual([]);
  });

  it('returns all tasks when the name is empty', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({});
      return [];
    }, 'find');

    const tasks = await getTasks('');

    expect(tasks).toEqual([]);
  });

  it('returns tasks matching the provided name', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ name: taskName });
      return [sampleTask];
    }, 'find');

    const tasks = await getTasks(taskName);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe(taskName);
  });

  it('returns an empty array when no tasks match the provided name', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ name: 'Missing task' });
      return [];
    }, 'find');

    const tasks = await getTasks('Missing task');

    expect(tasks).toEqual([]);
  });

  it('propagates an error when retrieving all tasks fails', async () => {
    mockingoose(Task).toReturn(new Error('Task query failed'), 'find');

    await expect(getTasks()).rejects.toThrow('Task query failed');
  });

  it('propagates an error when searching tasks fails', async () => {
    mockingoose(Task).toReturn(new Error('Task search failed'), 'find');

    await expect(getTasks(taskName)).rejects.toThrow('Task search failed');
  });
});

describe('findTaskById', () => {
  it('returns the task with the given ID', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()._id.toString()).toBe(taskId);
      return sampleTask;
    }, 'findOne');

    const task = await findTaskById(taskId);

    expect(task).not.toBeNull();
    expect(task.name).toBe(taskName);
    expect(task._id.toString()).toBe(taskId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await findTaskById(taskId);

    expect(task).toBeNull();
  });

  it('propagates an error when the task query fails', async () => {
    mockingoose(Task).toReturn(new Error('Task lookup failed'), 'findOne');

    await expect(findTaskById(taskId)).rejects.toThrow('Task lookup failed');
  });
});

describe('findTaskByName', () => {
  it('returns tasks with the given name', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ name: taskName });
      return [sampleTask];
    }, 'find');

    const tasks = await findTaskByName(taskName);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe(taskName);
  });

  it('returns an empty array when no task has the given name', async () => {
    const missingTaskName = 'Missing task';

    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ name: missingTaskName });
      return [];
    }, 'find');

    const tasks = await findTaskByName(missingTaskName);

    expect(tasks).toEqual([]);
  });

  it('propagates an error when the name query fails', async () => {
    mockingoose(Task).toReturn(new Error('Task name query failed'), 'find');

    await expect(findTaskByName(taskName)).rejects.toThrow(
      'Task name query failed'
    );
  });
});

describe('addTask', () => {
  it('saves a task with its list ID', async () => {
    mockingoose(Task).toReturn(sampleTask, 'save');

    const task = await addTask({
      name: taskName,
      listId,
    });

    expect(task.name).toBe(taskName);
    expect(String(task.listId)).toBe(listId);
    expect(task.archived).toBe(false);
  });

  it('propagates an error when saving fails', async () => {
    mockingoose(Task).toReturn(new Error('Save failed'), 'save');

    await expect(
      addTask({
        name: taskName,
        listId,
      })
    ).rejects.toThrow('Save failed');
  });
});

describe('updateTask', () => {
  it('updates and returns the task name', async () => {
    const updatedName = 'Updated task name';
    const updatedTask = {
      ...sampleTask,
      name: updatedName,
    };

    mockingoose(Task).toReturn(sampleTask, 'findOne');
    mockingoose(Task).toReturn(updatedTask, 'save');

    const task = await updateTask(taskId, { name: updatedName });

    expect(task.name).toBe(updatedName);
    expect(task._id.toString()).toBe(taskId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await updateTask(taskId, {
      name: 'Updated task name',
    });

    expect(task).toBeNull();
  });

  it('propagates an error when saving the update fails', async () => {
    mockingoose(Task).toReturn(sampleTask, 'findOne');
    mockingoose(Task).toReturn(new Error('Update save failed'), 'save');

    await expect(
      updateTask(taskId, { name: 'Updated task name' })
    ).rejects.toThrow('Update save failed');
  });

  it('propagates an error when looking up the task fails', async () => {
    mockingoose(Task).toReturn(new Error('Update lookup failed'), 'findOne');

    await expect(
      updateTask(taskId, { name: 'Updated task name' })
    ).rejects.toThrow('Update lookup failed');
  });
});

describe('deleteTask', () => {
  it('marks the task as deleted and returns it', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()._id.toString()).toBe(taskId);
      return sampleTask;
    }, 'findOne');
    mockingoose(Task).toReturn(sampleDeletedTask, 'save');

    const task = await deleteTask(taskId);

    expect(task.deleted).toBe(true);
    expect(task.name).toBe(taskName);
    expect(task._id.toString()).toBe(taskId);
  });

  it('marks the task with the requested ID as deleted when names are the same', async () => {
    const otherTaskId = '507f1f77bcf86cd799439012';
    const tasksWithSameName = [
      sampleTask,
      {
        ...sampleTask,
        _id: otherTaskId,
      },
    ];

    mockingoose(Task).toReturn((query) => {
      const queryId = query.getQuery()._id.toString();
      expect(queryId).toBe(taskId);
      return tasksWithSameName.find((task) => task._id === queryId);
    }, 'findOne');
    mockingoose(Task).toReturn(sampleDeletedTask, 'save');

    const deletedTask = await deleteTask(taskId);

    expect(deletedTask.deleted).toBe(true);
    expect(deletedTask._id.toString()).toBe(taskId);
    expect(deletedTask.name).toBe(taskName);
    expect(deletedTask._id.toString()).not.toBe(otherTaskId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await deleteTask(taskId);

    expect(task).toBeNull();
  });

  it('propagates an error when saving the deletion fails', async () => {
    mockingoose(Task).toReturn(sampleTask, 'findOne');
    mockingoose(Task).toReturn(new Error('Delete save failed'), 'save');

    await expect(deleteTask(taskId)).rejects.toThrow('Delete save failed');
  });

  it('propagates an error when looking up the task to delete fails', async () => {
    mockingoose(Task).toReturn(new Error('Delete lookup failed'), 'findOne');

    await expect(deleteTask(taskId)).rejects.toThrow('Delete lookup failed');
  });
});

describe('archiveTask', () => {
  it('marks the task as archived and returns it', async () => {
    mockingoose(Task).toReturn(sampleTask, 'findOne');
    mockingoose(Task).toReturn(sampleArchivedTask, 'save');

    const task = await archiveTask(taskId);

    expect(task.archived).toBe(true);
    expect(task._id.toString()).toBe(taskId);
    expect(String(task.listId)).toBe(listId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await archiveTask(taskId);

    expect(task).toBeNull();
  });

  it('propagates an error when saving the archive fails', async () => {
    mockingoose(Task).toReturn(sampleTask, 'findOne');
    mockingoose(Task).toReturn(new Error('Archive save failed'), 'save');

    await expect(archiveTask(taskId)).rejects.toThrow('Archive save failed');
  });

  it('propagates an error when looking up the task to archive fails', async () => {
    mockingoose(Task).toReturn(new Error('Archive lookup failed'), 'findOne');

    await expect(archiveTask(taskId)).rejects.toThrow('Archive lookup failed');
  });
});

describe('getArchivedTasks', () => {
  it('returns tasks marked as archived', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ archived: true });
      return [sampleArchivedTask];
    }, 'find');

    const tasks = await getArchivedTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe(taskName);
    expect(tasks[0].archived).toBe(true);
  });

  it('returns an empty array when there are no archived tasks', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ archived: true });
      return [];
    }, 'find');

    const tasks = await getArchivedTasks();

    expect(tasks).toEqual([]);
  });

  it('propagates an error when retrieving archived tasks fails', async () => {
    mockingoose(Task).toReturn(new Error('Archived task query failed'), 'find');

    await expect(getArchivedTasks()).rejects.toThrow(
      'Archived task query failed'
    );
  });
});

describe('restoreArchivedTask', () => {
  it('marks the task as not archived and returns it', async () => {
    mockingoose(Task).toReturn(sampleArchivedTask, 'findOne');
    mockingoose(Task).toReturn(sampleTask, 'save');

    const task = await restoreArchivedTask(taskId);

    expect(task.archived).toBe(false);
    expect(task._id.toString()).toBe(taskId);
    expect(String(task.listId)).toBe(listId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await restoreArchivedTask(taskId);

    expect(task).toBeNull();
  });

  it('propagates an error when saving the restore fails', async () => {
    mockingoose(Task).toReturn(sampleArchivedTask, 'findOne');
    mockingoose(Task).toReturn(new Error('Restore save failed'), 'save');

    await expect(restoreArchivedTask(taskId)).rejects.toThrow(
      'Restore save failed'
    );
  });

  it('propagates an error when looking up the task to restore fails', async () => {
    mockingoose(Task).toReturn(new Error('Restore lookup failed'), 'findOne');

    await expect(restoreArchivedTask(taskId)).rejects.toThrow(
      'Restore lookup failed'
    );
  });
});

describe('getDeletedTasks', () => {
  it('returns tasks marked as deleted', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ deleted: true });
      return [sampleDeletedTask];
    }, 'find');

    const tasks = await getDeletedTasks();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe(taskName);
    expect(tasks[0].deleted).toBe(true);
  });

  it('returns an empty array when there are no deleted tasks', async () => {
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery()).toEqual({ deleted: true });
      return [];
    }, 'find');

    const tasks = await getDeletedTasks();

    expect(tasks).toEqual([]);
  });

  it('propagates an error when retrieving deleted tasks fails', async () => {
    mockingoose(Task).toReturn(new Error('Deleted task query failed'), 'find');

    await expect(getDeletedTasks()).rejects.toThrow(
      'Deleted task query failed'
    );
  });
});

describe('restoreDeletedTask', () => {
  it('marks the task as not deleted and returns it', async () => {
    mockingoose(Task).toReturn(sampleDeletedTask, 'findOne');
    mockingoose(Task).toReturn(sampleTask, 'save');

    const task = await restoreDeletedTask(taskId);

    expect(task.deleted).toBe(false);
    expect(task._id.toString()).toBe(taskId);
    expect(String(task.listId)).toBe(listId);
  });

  it('returns null when no task matches the given ID', async () => {
    mockingoose(Task).toReturn(null, 'findOne');

    const task = await restoreDeletedTask(taskId);

    expect(task).toBeNull();
  });

  it('propagates an error when saving the restore fails', async () => {
    mockingoose(Task).toReturn(sampleDeletedTask, 'findOne');
    mockingoose(Task).toReturn(
      new Error('Deleted task restore failed'),
      'save'
    );

    await expect(restoreDeletedTask(taskId)).rejects.toThrow(
      'Deleted task restore failed'
    );
  });

  it('propagates an error when looking up the deleted task fails', async () => {
    mockingoose(Task).toReturn(
      new Error('Deleted task lookup failed'),
      'findOne'
    );

    await expect(restoreDeletedTask(taskId)).rejects.toThrow(
      'Deleted task lookup failed'
    );
  });
});
