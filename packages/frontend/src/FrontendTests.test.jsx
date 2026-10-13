//Import statements
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from '@testing-library/react';
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
    expect(await screen.findByText('Homework 1')).toBeInTheDocument();

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
    expect(await screen.findByText('Homework 1')).toBeInTheDocument();

    // Click Archive
    await user.click(screen.getByRole('button', { name: 'Archive' }));

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
    expect(await screen.findByText('Homework 1')).toBeInTheDocument();

    // Click Delete
    await user.click(screen.getByRole('button', { name: 'Delete' }));

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

    expect(screen.getByText('Homework 1')).toBeInTheDocument();
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

    expect(screen.getByText('Homework 1')).toBeInTheDocument();
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
    expect(await screen.findByText('Homework 1')).toBeInTheDocument();

    // Wait for the original task to appear.
    const taskName = await screen.findByText('Homework 1');
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

    // Verify the updated name appears.
    expect(await screen.findByText('Updated Homework')).toBeInTheDocument();

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8000/tasks/task-123',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Homework' }),
      })
    );
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

    expect(await screen.findByText('Homework 1')).toBeInTheDocument();
    expect(screen.queryByText('Finish report')).not.toBeInTheDocument();

    // Click Work in the sidebar to switch lists.
    await user.click(screen.getByText('Work'));

    // The selected list and its tasks should change.
    expect(
      await screen.findByRole('heading', { name: 'Work' })
    ).toBeInTheDocument();

    expect(await screen.findByText('Finish report')).toBeInTheDocument();
    expect(screen.queryByText('Homework 1')).not.toBeInTheDocument();
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
