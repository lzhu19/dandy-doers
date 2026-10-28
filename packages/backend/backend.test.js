import { afterEach, describe, expect, it, jest } from '@jest/globals';
import mongoose from 'mongoose';
import request from 'supertest';
import { fileURLToPath } from 'node:url';

jest.unstable_mockModule('./task-services.js', () => ({
  getTasks: jest.fn(),
  findTaskById: jest.fn(),
  addTask: jest.fn(),
  updateTask: jest.fn(),
  reorderTasks: jest.fn(),
  deleteTask: jest.fn(),
  permanentlyDeleteTask: jest.fn(),
  archiveTask: jest.fn(),
  getArchivedTasks: jest.fn(),
  restoreArchivedTask: jest.fn(),
  restoreDeletedTask: jest.fn(),
  getDeletedTasks: jest.fn(),
}));

jest.unstable_mockModule('./list-services.js', () => ({
  addList: jest.fn(),
  deleteList: jest.fn(),
  findListById: jest.fn(),
  getLists: jest.fn(),
  updateListName: jest.fn(),
}));

const { default: app, startServer } = await import('./backend.js');
const {
  getTasks,
  getArchivedTasks,
  getDeletedTasks,
  findTaskById,
  addTask,
  deleteTask,
  permanentlyDeleteTask,
  updateTask,
  reorderTasks,
  archiveTask,
  restoreArchivedTask,
  restoreDeletedTask,
} = await import('./task-services.js');
const { getLists, findListById, addList, deleteList, updateListName } =
  await import('./list-services.js');
const originalExitCode = process.exitCode;

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  process.exitCode = originalExitCode;
});

async function expectLoggedServerError(
  responsePromise,
  error,
  logMessage,
  responseMessage
) {
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});
  const response = await responsePromise;

  expect(consoleError).toHaveBeenCalledWith(logMessage, error);
  expect(response.status).toBe(500);
  expect(response.text).toBe(responseMessage);
}

describe('startServer', () => {
  it('connects to MongoDB and starts listening', async () => {
    const connect = jest.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);
    const set = jest.spyOn(mongoose, 'set');
    const listen = jest
      .spyOn(app, 'listen')
      .mockImplementation((port, callback) => {
        callback();
        return app;
      });
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

    await startServer();

    expect(connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
    expect(set).toHaveBeenCalledWith('debug', true);
    expect(listen).toHaveBeenCalledWith(8000, expect.any(Function));
    expect(consoleLog).toHaveBeenCalledWith(
      'Example app listening at http://localhost:8000'
    );
  });

  it('logs connection failures and sets a failing exit code', async () => {
    const error = new Error('Database unavailable');
    jest.spyOn(mongoose, 'connect').mockRejectedValue(error);
    const listen = jest.spyOn(app, 'listen');
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    process.exitCode = 0;

    await startServer();

    expect(consoleError).toHaveBeenCalledWith(
      'Could not connect to MongoDB:',
      error
    );
    expect(listen).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('starts the server when run as the entry point', async () => {
    jest.resetModules();
    const { default: isolatedMongoose } = await import('mongoose');
    const error = new Error('Database unavailable');
    const connect = jest
      .spyOn(isolatedMongoose, 'connect')
      .mockRejectedValue(error);
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const originalArgv1 = process.argv[1];
    process.argv[1] = fileURLToPath(new URL('./backend.js', import.meta.url));

    try {
      await import('./backend.js');
      await new Promise((resolve) => setImmediate(resolve));

      expect(connect).toHaveBeenCalledWith(process.env.MONGODB_URI);
      expect(consoleError).toHaveBeenCalledWith(
        'Could not connect to MongoDB:',
        error
      );
    } finally {
      process.argv[1] = originalArgv1;
      jest.resetModules();
    }
  });
});

describe('GET /', () => {
  it('returns the backend welcome message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Welcome to the Dandy Doers backend!');
  });
});

describe('GET /tasks', () => {
  it('returns the tasks as JSON', async () => {
    const tasks = [{ _id: 'task-1', name: 'Write tests' }];
    getTasks.mockResolvedValueOnce(tasks);

    const response = await request(app).get('/tasks');

    expect(getTasks).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual(tasks);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    getTasks.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/tasks'),
      error,
      'Unable to retrieve tasks: ',
      'Unable to retrieve tasks.'
    );
  });
});

describe('POST /tasks', () => {
  const listId = '507f191e810c19729de860ea';

  it('creates and returns a task', async () => {
    const list = { _id: listId };
    const task = {
      _id: 'task-1',
      name: 'Write tests',
      listId,
      createdAt: '2026-10-28T06:00:00.000Z',
      updatedAt: '2026-10-28T06:00:00.000Z',
    };
    findListById.mockResolvedValueOnce(list);
    addTask.mockResolvedValueOnce(task);

    const response = await request(app)
      .post('/tasks')
      .send({ name: 'Write tests', listId });

    expect(findListById).toHaveBeenCalledWith(listId);
    expect(addTask).toHaveBeenCalledWith({ name: 'Write tests', listId });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(task);
    expect(response.body.createdAt).toBe(task.createdAt);
    expect(response.body.updatedAt).toBe(task.updatedAt);
  });

  it.each([
    ['missing name', { listId }],
    ['blank name', { name: '  ', listId }],
    ['invalid list ID', { name: 'Write tests', listId: 'not-an-object-id' }],
  ])('returns 400 for %s', async (_caseName, body) => {
    const response = await request(app).post('/tasks').send(body);

    expect(response.status).toBe(400);
    expect(response.text).toBe('Task name and a valid listId are required.');
    expect(findListById).not.toHaveBeenCalled();
    expect(addTask).not.toHaveBeenCalled();
  });

  it('returns 400 when the request has no body', async () => {
    const response = await request(app).post('/tasks');

    expect(response.status).toBe(400);
    expect(response.text).toBe('Task name and a valid listId are required.');
    expect(findListById).not.toHaveBeenCalled();
    expect(addTask).not.toHaveBeenCalled();
  });

  it('returns 400 when the specified list does not exist', async () => {
    findListById.mockResolvedValueOnce(null);

    const response = await request(app)
      .post('/tasks')
      .send({ name: 'Write tests', listId });

    expect(findListById).toHaveBeenCalledWith(listId);
    expect(addTask).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.text).toBe('The specified list does not exist.');
  });

  it('logs a list lookup error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    findListById.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).post('/tasks').send({ name: 'Write tests', listId }),
      error,
      'Could not add task to task list: ',
      'Could not add task to task list.'
    );
    expect(addTask).not.toHaveBeenCalled();
  });

  it('logs a task creation error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    findListById.mockResolvedValueOnce({ _id: listId });
    addTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).post('/tasks').send({ name: 'Write tests', listId }),
      error,
      'Could not add task to task list: ',
      'Could not add task to task list.'
    );
  });
});

describe('DELETE /tasks/:id', () => {
  it('deletes the task and returns 204', async () => {
    permanentlyDeleteTask.mockResolvedValueOnce({
      _id: 'task-1',
      name: 'Write tests',
    });

    const response = await request(app).delete('/tasks/task-1');

    expect(permanentlyDeleteTask).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(204);
  });

  it('returns 404 when the task is not found', async () => {
    permanentlyDeleteTask.mockResolvedValueOnce(null);

    const response = await request(app).delete('/tasks/missing-task');

    expect(permanentlyDeleteTask).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Task not found. Cannot delete.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    permanentlyDeleteTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).delete('/tasks/task-1'),
      error,
      'Could not delete task: ',
      'Could not delete task.'
    );
  });
});

describe('PUT /lists//reorder-tasks', () => {
  it('reorders the tasks and returns them', async () => {
    const reorderedTasks = [
      { _id: 'task-2', name: 'Second task', position: 0 },
      { _id: 'task-1', name: 'First task', position: 1 },
    ];

    reorderTasks.mockResolvedValueOnce(reorderedTasks);

    const response = await request(app)
      .put('/lists/list-1/reorder-tasks')
      .send({ taskIds: ['task-2', 'task-1'] });

    expect(reorderTasks).toHaveBeenCalledWith('list-1', ['task-2', 'task-1']);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(reorderedTasks);
  });

  it('returns 400 when taskIds is not an array', async () => {
    const response = await request(app)
      .put('/lists/list-1/reorder-tasks')
      .send({ taskIds: 'task-1' });

    expect(reorderTasks).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.text).toBe('taskIds must be an array.');
  });

  it('returns 400 when the request body is missing', async () => {
    const response = await request(app).put('/lists/list-1/reorder-tasks');

    expect(reorderTasks).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.text).toBe('taskIds must be an array.');
  });

  it('logs the service error and returns 500 when reordering fails', async () => {
    const error = new Error('Database unavailable');
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    reorderTasks.mockRejectedValueOnce(error);

    const response = await request(app)
      .put('/lists/list-1/reorder-tasks')
      .send({ taskIds: ['task-1', 'task-2'] });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Could not reorder tasks:',
      error
    );
    expect(response.status).toBe(500);
    expect(response.text).toBe('Could not reorder tasks.');

    consoleErrorSpy.mockRestore();
  });
});

describe('PUT /tasks/:id', () => {
  it('updates and returns the task', async () => {
    const updatedTask = { _id: 'task-1', name: 'Updated task' };
    updateTask.mockResolvedValueOnce(updatedTask);

    const response = await request(app)
      .put('/tasks/task-1')
      .send({ name: 'Updated task' });

    expect(updateTask).toHaveBeenCalledWith('task-1', {
      name: 'Updated task',
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedTask);
  });

  it('returns 404 when the task is not found', async () => {
    updateTask.mockResolvedValueOnce(null);

    const response = await request(app)
      .put('/tasks/missing-task')
      .send({ name: 'Updated task' });

    expect(updateTask).toHaveBeenCalledWith('missing-task', {
      name: 'Updated task',
    });
    expect(response.status).toBe(404);
    expect(response.text).toBe('Task not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    updateTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/tasks/task-1').send({ name: 'Updated task' }),
      error,
      'Could not update task name: ',
      'Could not update task name.'
    );
  });
});

describe('PUT /tasks/:id/archive', () => {
  it('archives and returns the task', async () => {
    const archivedTask = {
      _id: 'task-1',
      name: 'Write tests',
      archived: true,
    };
    archiveTask.mockResolvedValueOnce(archivedTask);

    const response = await request(app).put('/tasks/task-1/archive');

    expect(archiveTask).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(archivedTask);
  });

  it('returns 404 when the task is not found', async () => {
    archiveTask.mockResolvedValueOnce(null);

    const response = await request(app).put('/tasks/missing-task/archive');

    expect(archiveTask).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Task not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    archiveTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/tasks/task-1/archive'),
      error,
      'Could not archive task: ',
      'Could not archive task.'
    );
  });
});

describe('PUT /tasks/:id/restore-archived', () => {
  it('restores and returns the archived task', async () => {
    const restoredTask = {
      _id: 'task-1',
      name: 'Write tests',
      archived: false,
    };
    restoreArchivedTask.mockResolvedValueOnce(restoredTask);

    const response = await request(app).put('/tasks/task-1/restore-archived');

    expect(restoreArchivedTask).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(restoredTask);
  });

  it('returns 404 when the task is not found', async () => {
    restoreArchivedTask.mockResolvedValueOnce(null);

    const response = await request(app).put(
      '/tasks/missing-task/restore-archived'
    );

    expect(restoreArchivedTask).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Resource not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    restoreArchivedTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/tasks/task-1/restore-archived'),
      error,
      'Could not restore archived task: ',
      'Could not restore archived task.'
    );
  });
});

describe('PUT /tasks/:id/restore-deleted', () => {
  it('restores and returns the deleted task', async () => {
    const restoredTask = {
      _id: 'task-1',
      name: 'Write tests',
      deleted: false,
    };
    restoreDeletedTask.mockResolvedValueOnce(restoredTask);

    const response = await request(app).put('/tasks/task-1/restore-deleted');

    expect(restoreDeletedTask).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(restoredTask);
  });

  it('returns 404 when the task is not found', async () => {
    restoreDeletedTask.mockResolvedValueOnce(null);

    const response = await request(app).put(
      '/tasks/missing-task/restore-deleted'
    );

    expect(restoreDeletedTask).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Resource not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    restoreDeletedTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/tasks/task-1/restore-deleted'),
      error,
      'Could not restore deleted task: ',
      'Could not restore deleted task.'
    );
  });
});

describe('PUT /tasks/:id/delete', () => {
  it('soft-deletes and returns the task', async () => {
    const deletedTask = {
      _id: 'task-1',
      name: 'Write tests',
      deleted: true,
    };
    deleteTask.mockResolvedValueOnce(deletedTask);

    const response = await request(app).put('/tasks/task-1/delete');

    expect(deleteTask).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(deletedTask);
  });

  it('returns 404 when the task is not found', async () => {
    deleteTask.mockResolvedValueOnce(null);

    const response = await request(app).put('/tasks/missing-task/delete');

    expect(deleteTask).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
    expect(response.text).toBe('Resource not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    deleteTask.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/tasks/task-1/delete'),
      error,
      'Could not delete task: ',
      'Could not delete task.'
    );
  });
});

describe('DELETE /lists/:id', () => {
  it('deletes the list and returns 204', async () => {
    deleteList.mockResolvedValueOnce({ _id: 'list-1', name: 'Work' });

    const response = await request(app).delete('/lists/list-1');

    expect(deleteList).toHaveBeenCalledWith('list-1');
    expect(response.status).toBe(204);
  });

  it('returns 404 when the list is not found', async () => {
    deleteList.mockResolvedValueOnce(null);

    const response = await request(app).delete('/lists/missing-list');

    expect(deleteList).toHaveBeenCalledWith('missing-list');
    expect(response.status).toBe(404);
    expect(response.text).toBe('List not found. Cannot delete.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    deleteList.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).delete('/lists/list-1'),
      error,
      'Could not delete list: ',
      'Could not delete list.'
    );
  });
});

describe('PUT /lists/:id', () => {
  it('updates and returns the list', async () => {
    const updatedList = { _id: 'list-1', name: 'Personal' };
    updateListName.mockResolvedValueOnce(updatedList);

    const response = await request(app)
      .put('/lists/list-1')
      .send({ name: 'Personal' });

    expect(updateListName).toHaveBeenCalledWith('list-1', {
      name: 'Personal',
    });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(updatedList);
  });

  it('returns 404 when the list is not found', async () => {
    updateListName.mockResolvedValueOnce(null);

    const response = await request(app)
      .put('/lists/missing-list')
      .send({ name: 'Personal' });

    expect(updateListName).toHaveBeenCalledWith('missing-list', {
      name: 'Personal',
    });
    expect(response.status).toBe(404);
    expect(response.text).toBe('List not found. Cannot update.');
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    updateListName.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).put('/lists/list-1').send({ name: 'Personal' }),
      error,
      'Could not update list name: ',
      'Could not update list name.'
    );
  });
});

describe('GET /lists', () => {
  it('returns the lists as JSON', async () => {
    const lists = [{ _id: 'list-1', name: 'Work' }];
    getLists.mockResolvedValueOnce(lists);

    const response = await request(app).get('/lists');

    expect(getLists).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual(lists);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    getLists.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/lists'),
      error,
      'Unable to retrieve task lists: ',
      'Unable to retrieve task lists.'
    );
  });
});

describe('POST /lists', () => {
  it('creates and returns a list', async () => {
    const list = { _id: 'list-1', name: 'Work' };
    addList.mockResolvedValueOnce(list);

    const response = await request(app).post('/lists').send({ name: 'Work' });

    expect(addList).toHaveBeenCalledWith({ name: 'Work' });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(list);
  });

  it.each([
    ['a missing name', {}],
    ['a non-string name', { name: 42 }],
    ['an empty name', { name: '' }],
    ['a whitespace-only name', { name: '  ' }],
  ])('returns 400 for %s', async (_caseName, body) => {
    const response = await request(app).post('/lists').send(body);

    expect(addList).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.text).toBe('A non-empty list name is required.');
  });

  it('returns 400 when the request has no body', async () => {
    const response = await request(app).post('/lists');

    expect(addList).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(response.text).toBe('A non-empty list name is required.');
  });

  it('logs a service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    addList.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).post('/lists').send({ name: 'Work' }),
      error,
      'Could not add list: ',
      'Could not add list.'
    );
    expect(addList).toHaveBeenCalledWith({ name: 'Work' });
  });
});

describe('GET /lists/:id', () => {
  it('returns the list with the requested ID as JSON', async () => {
    const list = { _id: 'list-1', name: 'Work' };
    findListById.mockResolvedValueOnce(list);

    const response = await request(app).get('/lists/list-1');

    expect(findListById).toHaveBeenCalledWith('list-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(list);
  });

  it('returns 404 when the list is not found', async () => {
    findListById.mockResolvedValueOnce(null);

    const response = await request(app).get('/lists/missing-list');

    expect(findListById).toHaveBeenCalledWith('missing-list');
    expect(response.status).toBe(404);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    findListById.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/lists/list-1'),
      error,
      'List not found',
      'List not found.'
    );
  });
});

describe('GET /tasks/archived', () => {
  it('returns archived tasks as JSON', async () => {
    const archivedTasks = [
      { _id: 'task-1', name: 'Archived task', archived: true },
    ];
    getArchivedTasks.mockResolvedValueOnce(archivedTasks);

    const response = await request(app).get('/tasks/archived');

    expect(getArchivedTasks).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual(archivedTasks);
  });

  it('returns 404 when no archived tasks are found', async () => {
    getArchivedTasks.mockResolvedValueOnce(null);

    const response = await request(app).get('/tasks/archived');

    expect(response.status).toBe(404);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    getArchivedTasks.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/tasks/archived'),
      error,
      'Unable to retrieve archived tasks: ',
      'Unable to retrieve archived tasks.'
    );
  });
});

describe('GET /tasks/deleted', () => {
  it('returns deleted tasks as JSON', async () => {
    const deletedTasks = [
      { _id: 'task-1', name: 'Deleted task', deleted: true },
    ];
    getDeletedTasks.mockResolvedValueOnce(deletedTasks);

    const response = await request(app).get('/tasks/deleted');

    expect(getDeletedTasks).toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.body).toEqual(deletedTasks);
  });

  it('returns 404 when no deleted tasks are found', async () => {
    getDeletedTasks.mockResolvedValueOnce(null);

    const response = await request(app).get('/tasks/deleted');

    expect(response.status).toBe(404);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    getDeletedTasks.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/tasks/deleted'),
      error,
      'Unable to retrieve deleted tasks: ',
      'Unable to retrieve deleted tasks.'
    );
  });
});

describe('GET /tasks/:id', () => {
  it('returns the task with the requested ID as JSON', async () => {
    const task = { _id: 'task-1', name: 'Write tests' };
    findTaskById.mockResolvedValueOnce(task);

    const response = await request(app).get('/tasks/task-1');

    expect(findTaskById).toHaveBeenCalledWith('task-1');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(task);
  });

  it('returns 404 when the task is not found', async () => {
    findTaskById.mockResolvedValueOnce(null);

    const response = await request(app).get('/tasks/missing-task');

    expect(findTaskById).toHaveBeenCalledWith('missing-task');
    expect(response.status).toBe(404);
  });

  it('logs the service error and responds with a generic 500 error', async () => {
    const error = new Error('Database unavailable');
    findTaskById.mockRejectedValueOnce(error);
    await expectLoggedServerError(
      request(app).get('/tasks/task-1'),
      error,
      'Task not found: ',
      'Task not found.'
    );
  });
});
