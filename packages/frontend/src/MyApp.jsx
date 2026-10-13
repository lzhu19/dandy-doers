import { useState, useEffect } from 'react';
import Table from './Table';
import Form from './Form';
import './ToDoList.css';
import ArchiveList from './ArchiveList';
import DeleteList from './DeleteList';
import ListSection from './ListSection';
import SearchBar from './SearchBar';

function MyApp() {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listCreateError, setListCreateError] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [isDeleteListOpen, setIsDeleteListOpen] = useState(false);
  const [listDeleteError, setListDeleteError] = useState('');
  const [isDeletingList, setIsDeletingList] = useState(false);
  //starts as null, when user clicks set EditingId to the task's id
  const [editingId, setEditingId] = useState(null);

  const [archivedTasks, setArchivedTasks] = useState([]);

  const [deletedTasks, setDeletedTasks] = useState([]);

  function fetchTasks() {
    const promise = fetch('http://localhost:8000/tasks');
    return promise;
  }

  function fetchLists() {
    return fetch('http://localhost:8000/lists');
  }

  async function createList(event) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name) {
      setListCreateError('Enter a list name.');
      return;
    }

    setIsCreatingList(true);
    setListCreateError('');
    try {
      const response = await fetch('http://localhost:8000/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });
      if (response.status !== 201) {
        throw new Error(`Unable to create list (${response.status}).`);
      }

      const createdList = await response.json();
      setLists((currentLists) => [...currentLists, createdList]);
      setSelectedListId(createdList._id);
      setNewListName('');
      setIsCreateListOpen(false);
    } catch (error) {
      setListCreateError(error.message);
    } finally {
      setIsCreatingList(false);
    }
  }

  function openCreateListDialog() {
    setListCreateError('');
    setIsCreateListOpen(true);
  }

  async function deleteCurrentList() {
    if (!currentList) return;

    setIsDeletingList(true);
    setListDeleteError('');
    try {
      const response = await fetch(
        `http://localhost:8000/lists/${currentList._id}`,
        { method: 'DELETE' }
      );
      if (response.status !== 204) {
        throw new Error(`Unable to delete list (${response.status}).`);
      }

      const deletedListId = currentList._id;
      const remainingLists = lists.filter((list) => list._id !== deletedListId);
      const removeListTasks = (currentTasks) =>
        currentTasks.filter(
          (task) => String(task.listId) !== String(deletedListId)
        );

      setLists(remainingLists);
      setTasks(removeListTasks);
      setArchivedTasks(removeListTasks);
      setDeletedTasks(removeListTasks);
      setSelectedListId((currentId) =>
        currentId === deletedListId
          ? (remainingLists[0]?._id ?? null)
          : currentId
      );
      setIsDeleteListOpen(false);
    } catch (error) {
      setListDeleteError(error.message);
    } finally {
      setIsDeletingList(false);
    }
  }

  function postTask(job) {
    const promise = fetch('http://localhost:8000/tasks', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ ...job, listId: selectedListId }),
    });
    return promise;
  }

  function archiveTask(id) {
    // archives a task with the given id
    console.log('Archive clicked:', id); // for debugging purposes, remove later
    const promise = fetch(`http://localhost:8000/tasks/${id}/archive`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ archived: true }),
    });

    promise
      .then((response) => {
        if (response.status === 200) return response.json();
        return null;
      })
      .then((archivedTask) => {
        if (archivedTask !== null) {
          setArchivedTasks((currentArchivedTasks) => [
            ...currentArchivedTasks,
            archivedTask,
          ]);
          setTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function deleteTask(id) {
    // deletes a task with the given id
    console.log('Delete clicked:', id); // for debugging purposes, remove later
    const promise = fetch(`http://localhost:8000/tasks/${id}/delete`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ deleted: true }),
    });

    promise
      .then((response) => {
        if (response.status === 200) return response.json();
        return null;
      })
      .then((deletedTask) => {
        if (deletedTask !== null) {
          setDeletedTasks((currentDeletedTasks) => [
            ...currentDeletedTasks,
            deletedTask,
          ]);
          setTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
          setArchivedTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function restoreArchivedTask(id) {
    // restores an archived task with the given id
    console.log('Restore clicked:', id); // for debugging purposes, remove later
    const promise = fetch(
      `http://localhost:8000/tasks/${id}/restore-archived`,
      {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ archived: false }),
      }
    );

    promise
      .then((response) => {
        if (response.status === 200) return response.json();
        return null;
      })
      .then((restoredTask) => {
        if (restoredTask !== null) {
          setTasks((currentTasks) => [...currentTasks, restoredTask]);
          setArchivedTasks((currentArchivedTasks) =>
            currentArchivedTasks.filter((task) => task._id !== id)
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function restoreDeletedTask(id) {
    // restores an deleted task with the given id
    console.log('Restore deleted clicked:', id); // for debugging purposes, remove later
    const promise = fetch(`http://localhost:8000/tasks/${id}/restore-deleted`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ deleted: false }),
    });

    promise
      .then((response) => {
        if (response.status === 200) return response.json();
        return null;
      })
      .then((restoredTask) => {
        if (restoredTask !== null) {
          setTasks((currentTasks) => [...currentTasks, restoredTask]);
          setDeletedTasks((currentDeletedTasks) =>
            currentDeletedTasks.filter((task) => task._id !== id)
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function removeOneTask(id) {
    // removes a task with the given id
    const promise = fetch(`http://localhost:8000/tasks/${id}`, {
      method: 'DELETE',
    });

    promise
      .then((response) => {
        if (response.status === 204) {
          setTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
          setArchivedTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
          setDeletedTasks((currentTasks) =>
            currentTasks.filter((task) => task._id !== id)
          );
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  ///
  function updateOneTask(id, newEdit) {
    // updates a task's name for given id
    const promise = fetch(`http://localhost:8000/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ name: newEdit }),
    });

    promise
      .then((response) => {
        if (response.status === 200) return response.json();
        return null;
      })
      .then((updatedTask) => {
        if (updatedTask !== null) {
          setTasks((currentTasks) => {
            const newTasks = currentTasks.map((task) => {
              if (task._id === id) {
                return updatedTask;
              } else {
                return task;
              }
            });
            return newTasks;
          });
          setEditingId(null);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function updateList(job) {
    // updates the list of tasks if the form is submitted.
    // setTasks([...tasks, job]);
    postTask(job)
      .then((response) => {
        if (response.status === 201) return response.json();
        return null;
      })
      .then((addedTask) => {
        if (addedTask !== null) {
          setTasks((currentTasks) => [...currentTasks, addedTask]);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  useEffect(() => {
    fetchTasks()
      .then((res) => res.json()) // convert response to json
      .then((tasks) => {
        setTasks(
          tasks.filter(
            (task) => task.archived !== true && task.deleted !== true
          )
        );
        setArchivedTasks(
          tasks.filter(
            (task) => task.archived === true && task.deleted !== true
          )
        );
        setDeletedTasks(tasks.filter((task) => task.deleted === true));
      })
      .catch((error) => {
        console.log(error);
      });
    fetchLists()
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Unable to retrieve lists: ${response.status}`);
        }
        return response.json();
      })
      .then((fetchedLists) => {
        setLists(fetchedLists);
        setSelectedListId(
          (currentListId) => currentListId ?? fetchedLists[0]?._id ?? null
        );
      })
      .catch((error) => {
        console.log(error);
      });
  }, []); // empty array here indicates that hook should be called only when component first mounts

  const currentList =
    lists.find((list) => list._id === selectedListId) ?? lists[0];
  const currentTasks = tasks.filter(
    (task) => String(task.listId) === String(currentList?._id)
  );

  return (
  <>
      <div className="main-layout">
        <aside className="sidebar">
          <div className="profile-icon" aria-hidden="true" />

          <div>
            <h2 className="sidebar-section-title">Upcoming</h2>
            <div className="upcoming-box">
              <p className="upcoming-empty-text">No upcoming tasks</p>
            </div>
          </div>

          <div>
            <h2 className="sidebar-section-title">Lists</h2>
            <ListSection
              lists={lists}
              selectedListId={currentList?._id}
              onSelectList={setSelectedListId}
            />
            <button
              className="add-list-button"
              type="button"
              onClick={openCreateListDialog}
            >
              + Add List
            </button>
          </div>
        </aside>

        <main className="main-content">
          <SearchBar
          removeTask={deleteTask}
          taskData={tasks}
          archiveTask={archiveTask}
          />
          {lists.length === 0 ? (
            <section className="empty-list-state">
              <p>You currently have no task lists</p>
              <button type="button" onClick={openCreateListDialog}>
                Create List
              </button>
            </section>
          ) : (
            <>
              <div className="main-header-row">
                <h1 className="main-header-title">{currentList.name}</h1>
                <button
                  className="delete-list-button"
                  type="button"
                  onClick={() => {
                    setListDeleteError('');
                    setIsDeleteListOpen(true);
                  }}
                >
                  Delete List
                </button>
              </div>
              <hr className="header-underline" />

              <div className="task-panel">
                {currentTasks.length === 0 ? (
                  <p className="task-panel-empty-text">
                    Get started by adding a task
                  </p>
                ) : (
                  <Table
                    taskData={currentTasks}
                    removeTask={deleteTask}
                    updateTask={updateOneTask}
                    archiveTask={archiveTask}
                    editingId={editingId}
                    setEditingId={setEditingId}
                  />
                )}
                <Form handleSubmit={updateList} />
              </div>

              <ArchiveList
                archivedTasks={archivedTasks}
                lists={lists}
                restoreArchivedTask={restoreArchivedTask}
                deleteTask={deleteTask}
              />
              <DeleteList
                deletedTasks={deletedTasks}
                lists={lists}
                restoreDeletedTask={restoreDeletedTask}
                permanentlyDeleteTask={removeOneTask}
              />
            </>
          )}
        </main>
      </div>

      {isCreateListOpen && (
        <div className="list-dialog-backdrop">
          <section
            className="list-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-list-title"
          >
            <h2 id="create-list-title">Create a list</h2>
            <form onSubmit={createList}>
              <label htmlFor="new-list-name">List name</label>
              <input
                autoFocus
                id="new-list-name"
                name="name"
                type="text"
                value={newListName}
                onChange={(event) => setNewListName(event.target.value)}
              />
              {listCreateError && (
                <p className="list-create-error" role="alert">
                  {listCreateError}
                </p>
              )}
              <div className="list-dialog-actions">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateListOpen(false);
                    setNewListName('');
                    setListCreateError('');
                  }}
                  disabled={isCreatingList}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isCreatingList}>
                  {isCreatingList ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      {isDeleteListOpen && currentList && (
        <div className="list-dialog-backdrop">
          <section
            className="list-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-list-title"
          >
            <h2 id="delete-list-title">Permanently delete list?</h2>
            <p>
              “{currentList.name}” and all its tasks will be permanently
              deleted, including archived and deleted tasks. This action cannot
              be undone.
            </p>
            {listDeleteError && (
              <p className="list-create-error" role="alert">
                {listDeleteError}
              </p>
            )}
            <div className="list-dialog-actions">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteListOpen(false);
                  setListDeleteError('');
                }}
                disabled={isDeletingList}
              >
                Cancel
              </button>
              <button
                className="confirm-delete-list-button"
                type="button"
                onClick={deleteCurrentList}
                disabled={isDeletingList}
              >
                {isDeletingList ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </section>
        </div>
      )}
  </>
  );
}

// make the component available to be imported into other components or files
export default MyApp;
