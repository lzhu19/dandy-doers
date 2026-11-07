//Import statements
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import {
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from 'vitest';
import MyApp from './MyApp';
import Form from './Form';
import ArchiveList from './ArchiveList';
import DeleteList from './DeleteList';
import Table from './Table';
import TaskDetails from './TaskDetails';

const list = { _id: 'list-1', name: 'School' };
const activeTask = {
  _id: 'task-1',
  name: 'Homework',
  listId: list._id,
};
const archivedTask = {
  _id: 'task-2',
  name: 'Archived homework',
  listId: list._id,
  archived: true,
};
const deletedTask = {
  _id: 'task-3',
  name: 'Deleted homework',
  listId: list._id,
  deleted: true,
};

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

function installApi({ tasks = [], lists = [list] } = {}) {
  const routes = new Map();
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method ?? 'GET';
    const route = routes.get(`${method} ${url}`);
    if (route) return route();

    if (url === 'http://localhost:8000/tasks' && method === 'GET') {
      return jsonResponse(tasks);
    }
    if (url === 'http://localhost:8000/lists' && method === 'GET') {
      return jsonResponse(lists);
    }
    throw new Error(`Unexpected fetch request: ${method} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { routes, fetchMock };
}

async function openApp() {
  render(<MyApp />);
  await screen.findByRole('heading', { name: list.name });
}

async function openArchivedSection(user) {
  await user.click(screen.getByText('Archived Tasks'));
}

async function openDeletedSection(user) {
  await user.click(screen.getByText('Deleted Tasks'));
}

//what happens before each test (mocks)
beforeAll(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn((url, options = {}) => {
      // Handle requests to /tasks
      if (url === 'http://localhost:8000/tasks') {
        // Create a new task
        if (options.method === 'POST') {
          const task = JSON.parse(options.body);

          return Promise.resolve({
            ok: true,
            status: 201,
            json: () =>
              Promise.resolve({
                _id: 'task-123',
                ...task,
              }),
          });
        }

        // Get all tasks
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      // Handle requests to /lists
      if (url === 'http://localhost:8000/lists') {
        // Create a new list
        if (options.method === 'POST') {
          const list = JSON.parse(options.body);

          return Promise.resolve({
            ok: true,
            status: 201,
            json: () =>
              Promise.resolve({
                _id: 'list-123',
                ...list,
              }),
          });
        }

        // Get all lists (empty by default)
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      // Handle requests to /lists/list-123
      if (url === 'http://localhost:8000/lists/list-123') {
        //delete an existing list
        if (options.method === 'DELETE') {
          return Promise.resolve({
            ok: true,
            status: 204,
          });
        }
      }

      // Handle unexpected URLs
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    })
  );
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

//Tests
//Rendering
describe('rendering', () => {
  it('renders without crashing when there are no lists or tasks', async () => {
    render(<MyApp />);

    expect(
      await screen.findByText('You currently have no task lists')
    ).toBeInTheDocument();
  });
});

//Creates a list
describe('createList', () => {
  it('creates a new list successfully', async () => {
    const user = userEvent.setup();

    render(<MyApp />);

    await screen.findByText('You currently have no task lists');

    await user.click(screen.getByRole('button', { name: 'Create List' }));

    await user.type(screen.getByLabelText('List name'), 'School');

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/lists',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'School' }),
      })
    );
  });
});

//Deletes a list

describe('deleteList', () => {
  it('deletes an existing list successfully', async () => {
    const user = userEvent.setup();

    // Mock the requests needed by this test.
    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the existing School list.
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'list-123',
                name: 'School',
              },
            ]),
        });
      }

      // Return no existing tasks.
      if (url === 'http://localhost:8000/tasks') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      // Successfully delete the School list.
      if (
        url === 'http://localhost:8000/lists/list-123' &&
        options.method === 'DELETE'
      ) {
        return Promise.resolve({
          ok: true,
          status: 204,
        });
      }

      // Reject any unexpected requests.
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    // Render the application.
    render(<MyApp />);

    // Verify that School exists before deleting it.
    expect(
      await screen.findByRole('heading', {
        name: 'School',
      })
    ).toBeInTheDocument();

    // Open the delete confirmation dialog.
    await user.click(
      screen.getByRole('button', {
        name: 'Delete List',
      })
    );

    // Wait for the confirmation dialog.
    await screen.findByText('Permanently delete list?');

    // Confirm deletion.
    await user.click(
      screen.getByRole('button', {
        name: 'Permanently Delete',
      })
    );

    // Verify the School list disappears.
    expect(
      screen.queryByRole('heading', {
        name: 'School',
      })
    ).not.toBeInTheDocument();

    // Verify the empty-state message appears.
    expect(
      await screen.findByText('You currently have no task lists')
    ).toBeInTheDocument();

    // Verify the DELETE request used the correct URL and method.
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/lists/list-123', {
      method: 'DELETE',
    });
  });
});

//Creates a task
describe('createTask', () => {
  it('creates a new task successfully', async () => {
    const user = userEvent.setup();

    // Return the School list when the application loads its lists
    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'list-123',
                name: 'School',
              },
            ]),
        });
      }

      // Create a task
      if (url === 'http://localhost:8000/tasks' && options.method === 'POST') {
        const task = JSON.parse(options.body);

        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              ...task,
            }),
        });
      }

      // Return an empty task list on initial load
      if (url === 'http://localhost:8000/tasks') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      // Handle any other list requests
      if (url === 'http://localhost:8000/lists') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    // Render the application
    render(<MyApp />);

    // Wait for the School list to appear
    await screen.findByRole('heading', {
      name: 'School',
    });

    // Enter the task name
    await user.type(screen.getByLabelText('Task'), 'Homework 1');

    // Click Add to submit the task
    await user.click(
      screen.getByRole('button', {
        name: 'Add',
      })
    );

    // Verify the task appears on the page
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Verify the task was sent to the backend
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Homework 1',
          listId: 'list-123',
        }),
      })
    );
  });
});

// Archives a task
describe('archiveTask', () => {
  it('archives an existing task successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an existing task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
              },
            ]),
        });
      }

      // Successfully mark the task as archived
      if (
        url === 'http://localhost:8000/tasks/task-123/archive' &&
        options.method === 'PUT'
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              archived: true,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task exists before archiving itit
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Click Archive
    await user.click(screen.getByRole('button', { name: 'Archive task' }));

    // Confirm the task disappears from the active task list
    expect(
      screen.getByText('Get started by adding a task')
    ).toBeInTheDocument();

    // Confirm the task appears in the Deleted Tasks section
    const archivedSection = screen
      .getByText('Archived Tasks')
      .closest('details');

    expect(archivedSection).toContainElement(screen.getByText('Homework 1'));

    // Verify the backend request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/archive',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      }
    );
  });
});

//Deletes a task
describe('deleteTask', () => {
  it('deletes an existing task successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an existing task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
              },
            ]),
        });
      }

      // Successfully mark the task as deleted
      if (
        url === 'http://localhost:8000/tasks/task-123/delete' &&
        options.method === 'PUT'
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              deleted: true,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task exists before deleting it
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Click Delete
    await user.click(screen.getByRole('button', { name: 'Delete task' }));

    // Confirm the task disappears from the active task list
    expect(
      screen.getByText('Get started by adding a task')
    ).toBeInTheDocument();

    // Confirm the task appears in the Deleted Tasks section
    const deletedSection = screen.getByText('Deleted Tasks').closest('details');

    expect(deletedSection).toContainElement(screen.getByText('Homework 1'));

    // Verify the backend request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/delete',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ deleted: true }),
      }
    );
  });
});

// Undoes a deleted task
describe('undoDeleteTask', () => {
  it('restores an existing deleted task successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an already-deleted task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                deleted: true,
              },
            ]),
        });
      }

      // Successfully restore the task
      if (
        url === 'http://localhost:8000/tasks/task-123/restore-deleted' &&
        options.method === 'PUT'
      ) {
        const body = JSON.parse(options.body);

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              deleted: body.deleted,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task appears in Deleted Tasks
    const deletedHeading = await screen.findByText('Deleted Tasks');

    const deletedSection = deletedHeading.closest('details');

    expect(deletedSection).toContainElement(
      await within(deletedSection).findByText('Homework 1')
    );

    // Click Restore
    await user.click(
      within(deletedSection).getByRole('button', {
        name: 'Restore',
      })
    );

    // Verify the task returns to the active task list
    await waitFor(() => {
      expect(
        within(deletedSection).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    // Verify the restore request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/restore-deleted',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ deleted: false }),
      }
    );
  });
});

// Undoes an archived task
describe('undoArchiveTask', () => {
  it('restores an existing archived task successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an already-deleted task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: true,
              },
            ]),
        });
      }

      // Successfully restore the task
      if (
        url === 'http://localhost:8000/tasks/task-123/restore-archived' &&
        options.method === 'PUT'
      ) {
        const body = JSON.parse(options.body);

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              archived: body.archived,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task appears in Deleted Tasks
    const archivedHeading = await screen.findByText('Archived Tasks');

    const archivedSection = archivedHeading.closest('details');

    expect(archivedSection).toContainElement(
      await within(archivedSection).findByText('Homework 1')
    );

    // Click Restore
    await user.click(
      within(archivedSection).getByRole('button', {
        name: 'Restore',
      })
    );

    // Verify the task returns to the active task list
    await waitFor(() => {
      expect(
        within(archivedSection).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    // Verify the restore request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/restore-archived',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      }
    );
  });
});

// Permanently deletes a task
describe('permanentlyDeleteTask', () => {
  it('permanently deletes a task from the deleted section successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an already-deleted task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                deleted: true,
              },
            ]),
        });
      }

      // Successfully permanently delete the task
      if (
        url === 'http://localhost:8000/tasks/task-123' &&
        options.method === 'DELETE'
      ) {
        return Promise.resolve({
          ok: true,
          status: 204,
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task appears in Deleted Tasks
    const deletedHeading = await screen.findByText('Deleted Tasks');
    const deletedSection = deletedHeading.closest('details');

    expect(deletedSection).toContainElement(
      await within(deletedSection).findByText('Homework 1')
    );

    // Permanently delete the task
    await user.click(
      within(deletedSection).getByRole('button', {
        name: 'Permanently Delete',
      })
    );

    // Verify the task disappears entirely
    await waitFor(() => {
      expect(screen.queryByText('Homework 1')).not.toBeInTheDocument();
    });

    // Verify the DELETE request
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/tasks/task-123', {
      method: 'DELETE',
    });
  });
});

// Moves an archived task to Deleted Tasks
describe('deleteArchivedTask', () => {
  it('moves an archived task to Deleted Tasks successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an archived task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: true,
              },
            ]),
        });
      }

      // Successfully move the task to Deleted Tasks
      if (
        url === 'http://localhost:8000/tasks/task-123/delete' &&
        options.method === 'PUT'
      ) {
        const body = JSON.parse(options.body);

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              archived: false,
              deleted: body.deleted,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Verify the task appears in Archived Tasks
    const archivedHeading = await screen.findByText('Archived Tasks');
    const archivedSection = archivedHeading.closest('details');

    expect(archivedSection).toContainElement(
      await within(archivedSection).findByText('Homework 1')
    );

    // Click the button that deletes the archived task
    await user.click(
      within(archivedSection).getByRole('button', {
        name: /delete/i,
      })
    );

    // Verify the task leaves Archived Tasks
    await waitFor(() => {
      expect(
        within(archivedSection).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });

    // Verify the task appears in Deleted Tasks
    const deletedHeading = await screen.findByText('Deleted Tasks');
    const deletedSection = deletedHeading.closest('details');

    expect(deletedSection).toContainElement(
      within(deletedSection).getByText('Homework 1')
    );
  });
});

//Edits a task
describe('editTask', () => {
  it('updates an existing task successfully', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }

      if (
        url === 'http://localhost:8000/tasks/task-123' &&
        options.method === 'PUT'
      ) {
        const body = JSON.parse(options.body);

        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: body.name,
              listId: 'list-123',
              archived: false,
              deleted: false,
            }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Wait for the original task to appear.
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Find the task in the main table.
    const taskName = await screen.findByRole('cell', {
      name: 'Homework 1',
    });

    expect(taskName).toBeInTheDocument();

    // Click the task name to edit it.
    await user.click(taskName);

    // Find the input containing the existing task name.
    const editInput = screen.getByDisplayValue('Homework 1');

    // Replace the name with the updated name.
    await user.clear(editInput);
    await user.type(editInput, 'Updated Homework');

    // Click outside the input to save the change.
    await user.click(document.body);

    // Verify the updated name appears in the task table.
    expect(
      await screen.findByRole('cell', { name: 'Updated Homework' })
    ).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Homework' }),
      })
    );
  });
});

// Reorders tasks
describe('reorderTasks', () => {
  it('reorders tasks successfully', async () => {
    const tasks = [
      {
        _id: 'task-1',
        name: 'Homework 1',
        listId: 'list-123',
        archived: false,
        deleted: false,
        position: 0,
      },
      {
        _id: 'task-2',
        name: 'Homework 2',
        listId: 'list-123',
        archived: false,
        deleted: false,
        position: 1,
      },
      {
        _id: 'task-3',
        name: 'Homework 3',
        listId: 'list-123',
        archived: false,
        deleted: false,
        position: 2,
      },
    ];

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list.
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return the existing tasks.
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(tasks),
        });
      }

      // Handle the reorder request.
      if (
        url === 'http://localhost:8000/lists/list-123/reorder-tasks' &&
        options.method === 'PUT'
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              { ...tasks[1], position: 0 },
              { ...tasks[0], position: 1 },
              { ...tasks[2], position: 2 },
            ]),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // Wait for the tasks to appear.
    await screen.findByRole('cell', {
      name: 'Homework 1',
    });

    // Find the draggable table rows.
    const homework1Row = screen
      .getByRole('cell', { name: 'Homework 1' })
      .closest('tr');

    const homework2Row = screen
      .getByRole('cell', { name: 'Homework 2' })
      .closest('tr');

    // Simulate dragging Homework 1 onto Homework 2.
    fireEvent.dragStart(homework1Row, {
      dataTransfer: { setDragImage: vi.fn() },
    });
    fireEvent.drop(homework2Row);

    // Verify the reorder request sent to the backend.
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/lists/list-123/reorder-tasks',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            taskIds: ['task-2', 'task-1', 'task-3'],
          }),
        })
      );
    });

    // Verify that the task order updates in the table.
    await waitFor(() => {
      const rows = screen
        .getAllByRole('row')
        .filter(
          (row) =>
            row.querySelector('td') &&
            !row.classList.contains('bottom-drop-zone')
        );

      expect(
        rows.map((row) => row.querySelectorAll('td')[1].textContent)
      ).toEqual(['Homework 2', 'Homework 1', 'Homework 3']);
    });
  });

  it('saves edits and reorders while preserving other tasks', async () => {
    const user = userEvent.setup();
    const secondTask = { _id: 'task-4', name: 'Essay', listId: list._id };
    const { routes } = installApi({ tasks: [activeTask, secondTask] });
    routes.set('PUT http://localhost:8000/tasks/task-1', async () =>
      jsonResponse({ ...activeTask, name: 'Updated homework' })
    );
    routes.set(
      'PUT http://localhost:8000/lists/list-1/reorder-tasks',
      async () => jsonResponse({})
    );

    await openApp();
    await user.click(screen.getByRole('cell', { name: 'Homework' }));
    fireEvent.blur(screen.getByDisplayValue('Homework'), {
      target: { value: 'Updated homework' },
    });
    expect(
      await screen.findByRole('cell', { name: 'Updated homework' })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Essay' })).toBeInTheDocument();

    const rows = document.querySelectorAll('tbody tr[draggable="true"]');
    const dataTransfer = { setDragImage: vi.fn() };
    fireEvent.dragStart(rows[0], { dataTransfer });
    fireEvent.drop(rows[1], { dataTransfer });

    await waitFor(() => {
      expect(
        routes.has('PUT http://localhost:8000/lists/list-1/reorder-tasks')
      ).toBe(true);
    });
    expect(
      await screen.findAllByRole('cell', { name: /Updated homework|Essay/ })
    ).toHaveLength(2);
  });

  it('reports an unsuccessful task reorder request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const secondTask = { _id: 'task-4', name: 'Essay', listId: list._id };
    const { routes, fetchMock } = installApi({
      tasks: [activeTask, secondTask],
    });
    routes.set(
      'PUT http://localhost:8000/lists/list-1/reorder-tasks',
      async () => jsonResponse({}, 503)
    );

    await openApp();
    const rows = document.querySelectorAll('tbody tr[draggable="true"]');
    const dataTransfer = { setDragImage: vi.fn() };
    fireEvent.dragStart(rows[0], { dataTransfer });
    fireEvent.drop(rows[1], { dataTransfer });

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        'Could not save task order:',
        expect.objectContaining({
          message: 'Unable to save task order (503).',
        })
      );
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/lists/list-1/reorder-tasks',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});

describe('editListName', () => {
  it('renames the selected list when its name is edited', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([]),
        });
      }

      if (
        url === 'http://localhost:8000/lists/list-123' &&
        options.method === 'PUT'
      ) {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ _id: 'list-123', name: body.name }),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    const listHeading = await screen.findByRole('heading', { name: 'School' });
    await user.click(
      within(listHeading).getByRole('button', { name: 'School' })
    );
    const renameInput = screen.getByRole('textbox', { name: 'Rename list' });
    await user.clear(renameInput);
    await user.type(renameInput, 'Classes');
    await user.click(document.body);

    expect(
      await screen.findByRole('heading', { name: 'Classes' })
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/lists/list-123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Classes' }),
      })
    );
  });
});

describe('list dialog workflows', () => {
  it('removes all tasks belonging to a deleted list and selects another list', async () => {
    const user = userEvent.setup();
    const secondList = { _id: 'list-2', name: 'Work' };
    const { routes } = installApi({
      tasks: [
        activeTask,
        archivedTask,
        deletedTask,
        { _id: 'task-4', name: 'Work task', listId: secondList._id },
      ],
      lists: [list, secondList],
    });
    routes.set('DELETE http://localhost:8000/lists/list-1', async () =>
      jsonResponse({}, 204)
    );
    await openApp();

    await user.click(screen.getByRole('button', { name: 'Delete List' }));
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Permanently Delete',
      })
    );

    expect(await screen.findByRole('heading', { name: 'Work' })).toBeVisible();
    expect(screen.getByRole('cell', { name: 'Work task' })).toBeInTheDocument();
    expect(screen.queryByRole('cell', { name: 'Homework' })).toBeNull();
    expect(screen.queryByText('Archived homework')).not.toBeInTheDocument();
    expect(screen.queryByText('Deleted homework')).not.toBeInTheDocument();
  });

  it('validates, reports create failures, and closes the create dialog', async () => {
    const user = userEvent.setup();
    const { routes, fetchMock } = installApi();
    routes.set('POST http://localhost:8000/lists', async () =>
      jsonResponse({}, 503)
    );
    await openApp();

    await user.click(screen.getByRole('button', { name: '+ Add List' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a list name.');
    expect(fetchMock).not.toHaveBeenCalledWith(
      'http://localhost:8000/lists',
      expect.objectContaining({ method: 'POST' })
    );

    await user.type(screen.getByLabelText('List name'), 'Other');
    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to create list (503).'
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reports delete failures and closes the confirmation dialog on cancel', async () => {
    const user = userEvent.setup();
    const { routes } = installApi();
    routes.set('DELETE http://localhost:8000/lists/list-1', async () =>
      jsonResponse({}, 500)
    );
    await openApp();

    await user.click(screen.getByRole('button', { name: 'Delete List' }));
    await user.click(
      screen.getByRole('button', { name: 'Permanently Delete' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to delete list (500).'
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('validates a blank rename and displays a failed rename response', async () => {
    const user = userEvent.setup();
    const { routes } = installApi();
    routes.set('PUT http://localhost:8000/lists/list-1', async () =>
      jsonResponse({}, 500)
    );
    await openApp();

    await user.click(screen.getAllByRole('button', { name: 'School' })[1]);
    const renameInput = screen.getByRole('textbox', { name: 'Rename list' });
    await user.clear(renameInput);
    fireEvent.blur(renameInput);
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a list name.');

    await user.type(renameInput, 'New name');
    fireEvent.blur(renameInput);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unable to rename list (500).'
    );
  });

  it('renames one list without changing the others', async () => {
    const user = userEvent.setup();
    const secondList = { _id: 'list-2', name: 'Work' };
    const renamedList = { ...list, name: 'Classes' };
    const { routes } = installApi({ lists: [list, secondList] });
    routes.set('PUT http://localhost:8000/lists/list-1', async () =>
      jsonResponse(renamedList)
    );
    await openApp();

    await user.click(screen.getAllByRole('button', { name: 'School' })[1]);
    const renameInput = screen.getByRole('textbox', { name: 'Rename list' });
    await user.clear(renameInput);
    await user.type(renameInput, renamedList.name);
    fireEvent.blur(renameInput);

    expect(
      await within(document.querySelector('.main-header-row')).findByRole(
        'button',
        { name: renamedList.name }
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Work' })).toBeInTheDocument();
  });
});

//Tests list switching
describe('switch lists', () => {
  it('displays the tasks for the selected list', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              { _id: 'list-123', name: 'School' },
              { _id: 'list-456', name: 'Work' },
            ]),
        });
      }

      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-456',
                name: 'Finish report',
                listId: 'list-456',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // School is selected initially.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('cell', { name: 'Finish report' })
    ).not.toBeInTheDocument();

    // Click Work in the sidebar to switch lists.
    await user.click(screen.getByText('Work'));

    // The selected list and its tasks should change.
    expect(
      await screen.findByRole('heading', { name: 'Work' })
    ).toBeInTheDocument();

    // Verify Finish report appears in the main task table.
    expect(
      await screen.findByRole('cell', { name: 'Finish report' })
    ).toBeInTheDocument();

    // Verify Homework 1 is no longer in the main task table.
    expect(
      screen.queryByRole('cell', { name: 'Homework 1' })
    ).not.toBeInTheDocument();
  });
});

//covers uncovered stuff in form.jsx
describe('Form', () => {
  it('prevents the default form submission', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<Form handleSubmit={handleSubmit} />);

    // Find the form and submit it.
    const form = document.querySelector('form');
    form.addEventListener('submit', (event) => {
      vi.spyOn(event, 'preventDefault');
    });

    await user.click(screen.getByRole('button', { name: /add/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it('does not submit a blank task and clears a submitted task', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<Form handleSubmit={handleSubmit} />);
    const input = screen.getByLabelText('Task');

    fireEvent.submit(input.closest('form'));
    await user.type(input, '   ');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(handleSubmit).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, 'Read chapter');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(handleSubmit).toHaveBeenCalledWith({ name: 'Read chapter' });
    expect(input).toHaveValue('');
  });
});

describe('Table interactions', () => {
  it('supports task actions, inline editing, and drag-and-drop reorder', () => {
    const props = {
      taskData: [activeTask, { ...activeTask, _id: 'task-2', name: 'Essay' }],
      selectedTaskId: [],
      reorderTasks: vi.fn(),
      removeTask: vi.fn(),
      updateTask: vi.fn(),
      archiveTask: vi.fn(),
      setEditingId: vi.fn(),
      setTaskDetailsId: vi.fn(),
      setSelectedTaskId: vi.fn(),
    };
    const { container, rerender } = render(<Table {...props} />);
    fireEvent.click(screen.getByText('Homework'));
    expect(props.setEditingId).toHaveBeenCalledWith('task-1');
    rerender(<Table {...props} editingId="task-1" />);
    fireEvent.blur(screen.getByDisplayValue('Homework'), {
      target: { value: 'New homework' },
    });
    expect(props.updateTask).toHaveBeenCalledWith('task-1', 'New homework');

    const rows = container.querySelectorAll('tbody tr[draggable="true"]');
    const [firstRow, secondRow] = rows;
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setDragImage: vi.fn(),
    };

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Open task details' })[0]
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Archive task' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete task' })[0]);
    expect(props.setTaskDetailsId).toHaveBeenCalledWith('task-1');
    expect(props.archiveTask).toHaveBeenCalledWith('task-1');
    expect(props.removeTask).toHaveBeenCalledWith('task-1');

    fireEvent.dragStart(firstRow, { dataTransfer });
    fireEvent.dragOver(firstRow, { dataTransfer });
    fireEvent.dragOver(secondRow, { dataTransfer });
    expect(secondRow).toHaveClass('drop-target');
    fireEvent.drop(secondRow, { dataTransfer });
    expect(props.reorderTasks).toHaveBeenLastCalledWith('task-1', 'task-2');
    fireEvent.dragEnd(firstRow, { dataTransfer });
    expect(firstRow).not.toHaveClass('dragging');

    fireEvent.dragStart(firstRow, { dataTransfer });
    fireEvent.drop(firstRow, { dataTransfer });
    expect(props.reorderTasks).toHaveBeenCalledTimes(1);

    const bottomDropZone = container.querySelector('.bottom-drop-zone');
    fireEvent.dragOver(bottomDropZone, { dataTransfer });
    expect(bottomDropZone).toHaveClass('drop-target');
    fireEvent.dragStart(firstRow, { dataTransfer });
    fireEvent.dragOver(bottomDropZone, { dataTransfer });
    fireEvent.drop(bottomDropZone, { dataTransfer });
    expect(props.reorderTasks).toHaveBeenLastCalledWith('task-1', 'task-2');
    fireEvent.drop(bottomDropZone, { dataTransfer });
    expect(props.reorderTasks).toHaveBeenCalledTimes(2);
  });
});

describe('TaskDetails component', () => {
  it('rejects a blank name and saves edited name and notes', async () => {
    const user = userEvent.setup();
    const saveTaskDetails = vi.fn();
    render(
      <TaskDetails
        task={{ ...activeTask, notes: null }}
        saveTaskDetails={saveTaskDetails}
        closeTaskDetails={vi.fn()}
      />
    );

    const nameInput = screen.getByLabelText('Task');
    const notesInput = screen.getByLabelText('Notes');
    expect(notesInput).toHaveValue('');

    await user.clear(nameInput);
    await user.type(nameInput, '   ');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(saveTaskDetails).not.toHaveBeenCalled();

    await user.clear(nameInput);
    await user.type(nameInput, 'Read chapter');
    await user.type(notesInput, 'Pages 1-10');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveTaskDetails).toHaveBeenCalledWith('task-1', {
      name: 'Read chapter',
      notes: 'Pages 1-10',
    });
  });
});

describe('DeleteList', () => {
  it('displays the list name associated with a deleted task', () => {
    const task = {
      _id: 'task-3',
      name: 'Submit report',
      listId: 'list-2',
    };

    const lists = [{ _id: 'list-2', name: 'Work' }];

    render(
      <DeleteList
        deletedTasks={[task]}
        lists={lists}
        restoreDeletedTask={vi.fn()}
        removeOneTask={vi.fn()}
      />
    );

    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('uses the fallback when a deleted task has no matching list', () => {
    const task = {
      _id: 'task-4',
      name: 'Orphaned task',
      listId: 'missing-list',
    };

    render(
      <DeleteList
        deletedTasks={[task]}
        lists={[{ _id: 'list-1', name: 'Work' }]}
        restoreDeletedTask={vi.fn()}
        removeOneTask={vi.fn()}
      />
    );

    // Replace 'Unknown list' with the actual fallback in DeleteList.jsx
    expect(screen.getByText('Unknown list')).toBeInTheDocument();
  });
});

describe('ArchiveList', () => {
  it('displays the list name associated with an archived task', () => {
    const task = {
      _id: 'task-1',
      name: 'Finish homework',
      listId: 'list-1',
    };

    const lists = [{ _id: 'list-1', name: 'School' }];

    render(
      <ArchiveList
        archivedTasks={[task]}
        lists={lists}
        deleteTask={vi.fn()}
        restoreArchivedTask={vi.fn()}
        removeOneTask={vi.fn()}
      />
    );

    expect(screen.getByText('School')).toBeInTheDocument();
  });

  it('uses the fallback when an archived task has no matching list', () => {
    const task = {
      _id: 'task-2',
      name: 'Orphaned task',
      listId: 'missing-list',
    };

    render(
      <ArchiveList
        archivedTasks={[task]}
        lists={[{ _id: 'list-1', name: 'School' }]}
        deleteTask={vi.fn()}
        restoreArchivedTask={vi.fn()}
        removeOneTask={vi.fn()}
      />
    );

    // Replace 'Unknown list' with the actual fallback in ArchiveList.jsx
    expect(screen.getByText('Unknown list')).toBeInTheDocument();
  });
});

// Empty search result when nothing is typed into the search bar
describe('emptySearchResult', () => {
  it('return an empty search result before user types in the search bar', async () => {
    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Check that the search bar is empty.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    expect(searchbar).toHaveValue('');

    // Check that search results remain hidden.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).not.toBeVisible();
  });

  it('hides search results when the input is cleared', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Home');
    expect(searchbar).toHaveValue('Home');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).toBeVisible();

    await user.clear(searchbar);

    expect(searchbar).toHaveValue('');
    expect(within(searchResult).getByText('Homework 1')).not.toBeVisible();
  });
});

// Archived / Deleted Tasks are not populated in the search bar.
describe('exclude archived and deleted tasks from search results', () => {
  it('return no archived task when looking an archived task up in the search bar', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an archived task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: true,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Verify the task appears in Archived Tasks
    const archivedHeading = await screen.findByText('Archived Tasks');
    const archivedSection = archivedHeading.closest('details');

    expect(archivedSection).toContainElement(
      await within(archivedSection).findByText('Homework 1')
    );

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Homework 1');
    expect(searchbar).toHaveValue('Homework 1');

    // Check that search results does not appear.
    const searchResult = document.querySelector('#myTasks');
    expect(
      within(searchResult).queryByText('Homework 1')
    ).not.toBeInTheDocument();
  });

  it('return no deleted task when looking an deleted task up in the search bar', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an archived task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: true,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Verify the task appears in Archived Tasks
    const deletedHeading = await screen.findByText('Deleted Tasks');
    const deletedSection = deletedHeading.closest('details');

    expect(deletedSection).toContainElement(
      await within(deletedSection).findByText('Homework 1')
    );

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Homework 1');
    expect(searchbar).toHaveValue('Homework 1');

    // Check that search results does not appear.
    const searchResult = document.querySelector('#myTasks');
    expect(
      within(searchResult).queryByText('Homework 1')
    ).not.toBeInTheDocument();
  });
});

// Search bar returns a matching result.
describe('matching search results', () => {
  it('returns a task that matches part of the task name', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Home');
    expect(searchbar).toHaveValue('Home');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).toBeVisible();
  });

  it('returns a task that matches part of the task name regardless of case sensitivity', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1 and Finish report as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },

              {
                _id: 'task-1234',
                name: 'Finish report',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Finish report' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'hOme');
    expect(searchbar).toHaveValue('hOme');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).toBeVisible();
    expect(within(searchResult).getByText('Finish report')).not.toBeVisible();
  });

  it('returns multiple matches regardless of case sensitivity', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1,2 and 3 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },

              {
                _id: 'task-1234',
                name: 'Homework 2',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-1235',
                name: 'Homework 3',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-1237',
                name: 'Finish report',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 2' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 3' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'hOme');
    expect(searchbar).toHaveValue('hOme');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).toBeVisible();
    expect(within(searchResult).getByText('Homework 2')).toBeVisible();
    expect(within(searchResult).getByText('Homework 3')).toBeVisible();
    expect(within(searchResult).getByText('Finish report')).not.toBeVisible();
  });

  it('returns no matches regardless of case sensitvity', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // Return Homework 1,2 and 3 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },

              {
                _id: 'task-1234',
                name: 'Homework 2',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-1235',
                name: 'Homework 3',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-1237',
                name: 'Finish report',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 2' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 3' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'ilovecats >^•-•^<');
    expect(searchbar).toHaveValue('ilovecats >^•-•^<');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).not.toBeVisible();
    expect(within(searchResult).getByText('Homework 2')).not.toBeVisible();
    expect(within(searchResult).getByText('Homework 3')).not.toBeVisible();
    expect(within(searchResult).getByText('Finish report')).not.toBeVisible();
  });

  it('returns only tasks from the selected list', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              { _id: 'list-123', name: 'School' },
              { _id: 'list-12', name: 'Groceries' },
            ]),
        });
      }

      // Return as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Buy teacher',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-124',
                name: 'Buy cheese',
                listId: 'list-12',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Buy teacher' })
    ).toBeInTheDocument();

    // Check that the search bar appears and takes user input.
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Buy');
    expect(searchbar).toHaveValue('Buy');

    // Check that only matched search results do appear.
    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Buy teacher')).toBeVisible();
    expect(
      within(searchResult).queryByText('Buy cheese')
    ).not.toBeInTheDocument();
  });
});

describe('delete/archive a task from search bar and removes it from search query', () => {
  it('deletes only the task selected from search bar', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // check that Homework 1 is deleted
      if (
        url === 'http://localhost:8000/tasks/task-123/delete' &&
        options.method === 'PUT'
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              archived: false,
              deleted: true,
            }),
        });
      }

      // Return Homework 1 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-125',
                name: 'Homework 2',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 2' })
    ).toBeInTheDocument();

    // Add user input to search bar
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Homework');
    expect(searchbar).toHaveValue('Homework');

    // Check that search results
    const searchResult = document.querySelector('#myTasks');

    const deleted = within(searchResult).getByText('Homework 1').closest('li');
    await user.click(
      within(deleted).getByRole('button', { name: 'Delete', exact: true })
    );

    // check that after deleting the task, it is no longer displayed in search bar
    await waitFor(() => {
      expect(
        screen.queryByRole('cell', { name: 'Homework 1' })
      ).not.toBeInTheDocument();
      expect(
        within(searchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
      expect(within(searchResult).getByText('Homework 2')).toBeVisible();
    });

    // query the tasks again
    await user.clear(searchbar);
    await user.type(searchbar, 'Homework');
    expect(searchbar).toHaveValue('Homework');

    await waitFor(() => {
      expect(
        within(searchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });
    expect(within(searchResult).getByText('Homework 2')).toBeVisible();

    // Verify the backend request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/delete',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ deleted: true }),
      }
    );
  });

  it('archives only the task selected from search bar and removes it from search query', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      // Return the School list
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      // check that Homework 1 is archived
      if (
        url === 'http://localhost:8000/tasks/task-123/archive' &&
        options.method === 'PUT'
      ) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              _id: 'task-123',
              name: 'Homework 1',
              listId: 'list-123',
              archived: true,
              deleted: false,
            }),
        });
      }

      // Return Homework 1 as an active task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-125',
                name: 'Homework 2',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
    });

    render(<MyApp />);

    // Validate that tasks exist.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('cell', { name: 'Homework 2' })
    ).toBeInTheDocument();

    // Add user input to search bar
    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Homework');
    expect(searchbar).toHaveValue('Homework');

    // Check that search results
    const searchResult = document.querySelector('#myTasks');

    const archived = within(searchResult).getByText('Homework 1').closest('li');
    await user.click(
      within(archived).getByRole('button', { name: 'Archive', exact: true })
    );

    // check that after archiving the task, it is no longer displayed in search bar
    await waitFor(() => {
      expect(
        screen.queryByRole('cell', { name: 'Homework 1' })
      ).not.toBeInTheDocument();
      expect(
        within(searchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
      expect(within(searchResult).getByText('Homework 2')).toBeVisible();
    });

    // query the tasks again to check they don't reappear
    await user.clear(searchbar);
    await user.type(searchbar, 'Homework');
    expect(searchbar).toHaveValue('Homework');

    await waitFor(() => {
      expect(
        within(searchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });
    expect(within(searchResult).getByText('Homework 2')).toBeVisible();

    // Verify the backend request
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123/archive',
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      }
    );
  });
});

//Tests search bar queries a switched list.
describe('search bar queries a switched list', () => {
  it('search bar queries a switched list tasks', async () => {
    const user = userEvent.setup();

    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              { _id: 'list-123', name: 'School' },
              { _id: 'list-456', name: 'School 2' },
            ]),
        });
      }

      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-456',
                name: 'Homework 2',
                listId: 'list-456',
                archived: false,
                deleted: false,
              },
              {
                _id: 'task-4565',
                name: 'Do a backflip',
                listId: 'list-456',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }

      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });

    render(<MyApp />);

    // School is selected initially.
    expect(
      await screen.findByRole('heading', { name: 'School' })
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('cell', { name: 'Homework 1' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('cell', { name: 'Homework 2' })
    ).not.toBeInTheDocument();

    const searchbar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    await user.type(searchbar, 'Homework');
    expect(searchbar).toHaveValue('Homework');

    const searchResult = document.querySelector('#myTasks');
    expect(within(searchResult).getByText('Homework 1')).toBeVisible();
    expect(
      within(searchResult).queryByText('Homework 2')
    ).not.toBeInTheDocument();
    expect(
      within(searchResult).queryByText('Do a backflip')
    ).not.toBeInTheDocument();

    // Click School 2 in the sidebar to switch lists.
    await user.click(screen.getByText('School 2'));

    // The selected list and its tasks should change.
    expect(
      await screen.findByRole('heading', { name: 'School 2' })
    ).toBeInTheDocument();

    const newSearchBar = screen.getByPlaceholderText('Search for a task! ✎ ̼');
    const newSearchResult = document.querySelector('#myTasks');
    console.log({
      sameInput: searchbar === newSearchBar,
      oldInputConnected: searchbar.isConnected,
      oldValue: searchbar.value,
      newValue: newSearchBar.value,
    });
    // expect the user's intital input to be gone upon switching tasks
    expect(newSearchBar).toHaveValue('');

    // check that no new tasks are queried given an empty search bar
    await waitFor(() => {
      expect(within(newSearchResult).getByText('Homework 2')).not.toBeVisible();
      expect(
        within(newSearchResult).getByText('Do a backflip')
      ).not.toBeVisible();
      expect(
        within(newSearchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });

    // start a new search query
    await user.clear(newSearchBar);
    await user.type(newSearchBar, 'Homework');
    expect(newSearchBar).toHaveValue('Homework');

    await waitFor(() => {
      expect(within(newSearchResult).getByText('Homework 2')).toBeVisible();
      expect(
        within(newSearchResult).getByText('Do a backflip')
      ).not.toBeVisible();
      expect(
        within(newSearchResult).queryByText('Homework 1')
      ).not.toBeInTheDocument();
    });
  });
});

//Task details popup
describe('taskDetails', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockImplementation((url, options = {}) => {
      if (url === 'http://localhost:8000/lists' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve([{ _id: 'list-123', name: 'School' }]),
        });
      }

      //return hw 1 as an existing task
      if (url === 'http://localhost:8000/tasks' && !options.method) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                _id: 'task-123',
                name: 'Homework 1',
                listId: 'list-123',
                archived: false,
                deleted: false,
              },
            ]),
        });
      }
      return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
    });
  });
  //
  async function OpenTaskDetails(user) {
    render(<MyApp />);
    await screen.findByRole('cell', { name: 'Homework 1' });
    await user.click(screen.getByRole('button', { name: 'Open task details' }));

    return screen.findByRole('dialog', { name: 'Task details' });
  }
  //
  it('does not show up the popup until edit icon is clicked', async () => {
    render(<MyApp />);
    await screen.findByRole('cell', { name: 'Homework 1' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  //
  it('opens the task details popup when the edit icon is clicked', async () => {
    const user = userEvent.setup();
    const popup = await OpenTaskDetails(user);
    expect(popup).toBeInTheDocument();
  });
  //
  it('shows header text, divider, and save + cancel buttons', async () => {
    const user = userEvent.setup();
    const popup = await OpenTaskDetails(user);

    expect(
      within(popup).getByRole('heading', { name: 'Task details' })
    ).toBeInTheDocument();
    expect(within(popup).getByRole('separator')).toBeInTheDocument();
    expect(
      within(popup).getByRole('button', { name: 'Save' })
    ).toBeInTheDocument();
    expect(
      within(popup).getByRole('button', { name: 'Cancel' })
    ).toBeInTheDocument();
  });
  //
  it('closes the task details popup when the cancel button is clicked', async () => {
    const user = userEvent.setup();
    const popup = await OpenTaskDetails(user);

    await user.click(within(popup).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  //
  it('closes the popup when bg is clicked', async () => {
    const user = userEvent.setup();
    const popup = await OpenTaskDetails(user);

    await user.click(popup.parentElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps popup open when clicking inside it', async () => {
    const user = userEvent.setup();
    const popup = await OpenTaskDetails(user);

    await user.click(
      within(popup).getByRole('heading', { name: 'Task details' })
    );
    expect(
      screen.queryByRole('dialog', { name: 'Task details' })
    ).toBeInTheDocument();
  });

  it('updates the task after successfully saving its details', async () => {
    const user = userEvent.setup();
    const updatedTask = {
      _id: 'task-1',
      name: 'Updated homework',
      listId: 'list-1',
      notes: 'Review notes',
    };
    const secondTask = { _id: 'task-4', name: 'Essay', listId: list._id };
    const { routes, fetchMock } = installApi({
      tasks: [activeTask, secondTask],
    });
    routes.set('PUT http://localhost:8000/tasks/task-1', async () =>
      jsonResponse(updatedTask)
    );

    await openApp();
    await user.click(
      screen.getAllByRole('button', { name: 'Open task details' })[0]
    );
    const detailsDialog = screen.getByRole('dialog');
    const nameInput = within(detailsDialog).getByLabelText('Task');
    await user.clear(nameInput);
    await user.type(nameInput, updatedTask.name);
    await user.type(
      within(detailsDialog).getByLabelText('Notes'),
      updatedTask.notes
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByRole('cell', { name: updatedTask.name })
    ).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Essay' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          name: updatedTask.name,
          notes: updatedTask.notes,
        }),
      })
    );
  });
});

describe('task request failures', () => {
  it('removes a deleted task from active, archived, and deleted state after success', async () => {
    const user = userEvent.setup();
    const { routes } = installApi({
      tasks: [activeTask, archivedTask, deletedTask],
    });
    routes.set('DELETE http://localhost:8000/tasks/task-3', async () =>
      jsonResponse({}, 204)
    );
    await openApp();

    await openDeletedSection(user);
    await user.click(
      within(screen.getByText('Deleted homework').closest('li')).getByRole(
        'button',
        { name: 'Permanently Delete' }
      )
    );

    await waitFor(() => {
      expect(screen.queryByText('Deleted homework')).not.toBeInTheDocument();
    });
    expect(screen.getByRole('cell', { name: 'Homework' })).toBeInTheDocument();
    expect(screen.getByText('Archived homework')).toBeInTheDocument();
  });

  it('logs network errors from every task mutation handler', async () => {
    const user = userEvent.setup();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { routes } = installApi({
      tasks: [activeTask, archivedTask, deletedTask],
    });
    const error = new Error('Request failed');
    const failingRoutes = [
      'PUT http://localhost:8000/tasks/task-1/archive',
      'PUT http://localhost:8000/tasks/task-1/delete',
      'PUT http://localhost:8000/tasks/task-2/restore-archived',
      'PUT http://localhost:8000/tasks/task-2/delete',
      'PUT http://localhost:8000/tasks/task-3/restore-deleted',
      'DELETE http://localhost:8000/tasks/task-3',
      'PUT http://localhost:8000/tasks/task-1',
      'POST http://localhost:8000/tasks',
    ];
    failingRoutes.forEach((route) =>
      routes.set(route, () => Promise.reject(error))
    );

    await openApp();
    await user.click(screen.getByRole('button', { name: 'Archive task' }));
    await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
    await user.click(screen.getByRole('button', { name: 'Delete task' }));
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(2)
    );

    await openArchivedSection(user);
    await user.click(
      within(screen.getByText('Archived homework').closest('li')).getByRole(
        'button',
        { name: 'Restore' }
      )
    );
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(3)
    );
    await user.click(
      within(screen.getByText('Archived homework').closest('li')).getByRole(
        'button',
        { name: 'Delete' }
      )
    );
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(4)
    );

    await openDeletedSection(user);
    await user.click(
      within(screen.getByText('Deleted homework').closest('li')).getByRole(
        'button',
        { name: 'Restore' }
      )
    );
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(5)
    );
    await user.click(
      within(screen.getByText('Deleted homework').closest('li')).getByRole(
        'button',
        { name: 'Permanently Delete' }
      )
    );
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(6)
    );

    await user.click(screen.getByRole('cell', { name: 'Homework' }));
    fireEvent.blur(screen.getByDisplayValue('Homework'), {
      target: { value: 'Renamed' },
    });
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(7)
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Open task details' })[0]
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(9)
    );
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await user.type(screen.getByLabelText('Task'), 'New task');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() =>
      expect(
        console.log.mock.calls.filter(([logged]) => logged === error)
      ).toHaveLength(10)
    );
  });

  it('keeps task lists stable when task actions receive unsuccessful responses', async () => {
    const user = userEvent.setup();
    const { routes, fetchMock } = installApi({
      tasks: [activeTask, archivedTask, deletedTask],
    });
    routes.set('PUT http://localhost:8000/tasks/task-1/archive', async () =>
      jsonResponse({}, 500)
    );
    routes.set('PUT http://localhost:8000/tasks/task-1/delete', async () =>
      jsonResponse({}, 500)
    );
    routes.set(
      'PUT http://localhost:8000/tasks/task-2/restore-archived',
      async () => jsonResponse({}, 500)
    );
    routes.set(
      'PUT http://localhost:8000/tasks/task-3/restore-deleted',
      async () => jsonResponse({}, 500)
    );
    routes.set('DELETE http://localhost:8000/tasks/task-3', async () =>
      jsonResponse({}, 500)
    );
    routes.set('PUT http://localhost:8000/tasks/task-1', async () =>
      jsonResponse({}, 500)
    );
    routes.set('POST http://localhost:8000/tasks', async () =>
      jsonResponse({}, 500)
    );

    await openApp();
    await screen.findByRole('cell', { name: 'Homework' });
    await user.click(screen.getByRole('button', { name: 'Archive task' }));
    await user.click(screen.getByRole('button', { name: 'Delete task' }));

    await openArchivedSection(user);
    await user.click(
      within(screen.getByText('Archived homework').closest('li')).getByRole(
        'button',
        { name: 'Restore' }
      )
    );

    await openDeletedSection(user);
    await user.click(
      within(screen.getByText('Deleted homework').closest('li')).getByRole(
        'button',
        { name: 'Restore' }
      )
    );
    await user.click(
      within(screen.getByText('Deleted homework').closest('li')).getByRole(
        'button',
        { name: 'Permanently Delete' }
      )
    );

    await user.click(screen.getByRole('cell', { name: 'Homework' }));
    fireEvent.blur(screen.getByDisplayValue('Homework'), {
      target: { value: 'Renamed' },
    });
    await user.click(
      screen.getAllByRole('button', { name: 'Open task details' })[0]
    );
    await user.clear(screen.getByLabelText('Notes'));
    await user.type(screen.getByLabelText('Notes'), 'Details');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.type(screen.getByLabelText('Task'), 'New task');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/tasks/task-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Renamed' }),
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/tasks/task-1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Homework', notes: 'Details' }),
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:8000/tasks',
        expect.objectContaining({ method: 'POST' })
      );
    });
    expect(
      screen.getAllByRole('textbox').map((input) => input.value)
    ).toContain('Renamed');
  });

  it('logs rejected task/list loading and mutation requests', async () => {
    const { routes } = installApi({ tasks: [activeTask] });
    const error = new Error('Network unavailable');
    routes.set('GET http://localhost:8000/tasks', () => Promise.reject(error));
    routes.set('GET http://localhost:8000/lists', async () =>
      jsonResponse([], 503)
    );
    render(<MyApp />);
    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(error);
      expect(console.log).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Unable to retrieve lists: 503' })
      );
    });
  });
});
