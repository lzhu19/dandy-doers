import { useState, useEffect } from 'react';
import Table from './Table';
import Form from './Form';
import './ToDoList.css';
import ArchiveList from './ArchiveList';
import DeleteList from './DeleteList';
import ListSection from './ListSection';
import SearchBar from './SearchBar';
import TaskDetails from './TaskDetails';

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

  //starts as null then wehn user clicks the edit icon set taskDetailsId to the task's id
  const [taskDetailsId, setTaskDetailsId] = useState(null);

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

async function reorderTasks(draggedTaskId, targetTaskId) {
  if (!currentList) return;

  
  const listTasks = tasks.filter(
    (task) => String(task.listId) === String(currentList._id)
  );

  const reordered = [...listTasks];

  const draggedIndex = reordered.findIndex(
    (task) => task._id === draggedTaskId
  );

  const targetIndex = reordered.findIndex(
    (task) => task._id === targetTaskId
  );

  
  if (draggedIndex === -1 || targetIndex === -1) return;

  
  const [draggedItem] = reordered.splice(draggedIndex, 1);

  
  reordered.splice(targetIndex, 0, draggedItem);

 
  setTasks((allTasks) => {
    const otherTasks = allTasks.filter(
      (task) => String(task.listId) !== String(currentList._id)
    );

    return [...otherTasks, ...reordered];
  });

 
  try {
    const response = await fetch(
      `http://localhost:8000/lists/${currentList._id}/reorder-tasks`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskIds: reordered.map((task) => task._id),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Unable to save task order (${response.status}).`);
    }

    console.log('Task order saved successfully!');
  } catch (error) {
    console.error('Could not save task order:', error);
  }
}

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
                  className="delete-list-icon-button"
                  type="button"
                  aria-label="Delete List"
                  onClick={() => {
                    setListDeleteError('');
                    setIsDeleteListOpen(true);
                  }}
                >
                  <TrashIcon />
                </button>
              </div>
              <hr className="header-underline" />

              <div className="task-panel">
                <SearchBar
                  lists={lists}
                  removeTask={deleteTask}
                  taskData={currentTasks}
                  archiveTask={archiveTask}
                />
                {currentTasks.length === 0 ? (
                  <p className="task-panel-empty-text">
                    Get started by adding a task
                  </p>
                ) : (
                  <Table
                    taskData={currentTasks}
                     reorderTasks={reorderTasks}
                    removeTask={deleteTask}
                    updateTask={updateOneTask}
                    archiveTask={archiveTask}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    setTaskDetailsId={setTaskDetailsId}
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
      {taskDetailsId && (
        <TaskDetails closeTaskDetails={() => setTaskDetailsId(null)} />
      )}
    </>
  );
}


function TrashIcon() {
  return (
    <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.5699 17.0002H4.42994C4.23754 16.9957 4.04791 16.9533 3.87191 16.8754C3.6959 16.7976 3.53695 16.6858 3.40415 16.5465C3.27136 16.4072 3.16731 16.2431 3.09795 16.0636C3.02859 15.8841 2.99529 15.6926 2.99994 15.5002V5.61523H3.99994V15.5002C3.99517 15.5613 4.00252 15.6228 4.02157 15.681C4.04063 15.7393 4.07101 15.7932 4.11097 15.8396C4.15093 15.8861 4.19968 15.9242 4.25442 15.9518C4.30917 15.9793 4.36881 15.9958 4.42994 16.0002H13.5699C13.6311 15.9958 13.6907 15.9793 13.7455 15.9518C13.8002 15.9242 13.8489 15.8861 13.8889 15.8396C13.9289 15.7932 13.9593 15.7393 13.9783 15.681C13.9974 15.6228 14.0047 15.5613 13.9999 15.5002V5.61523H14.9999V15.5002C15.0046 15.6926 14.9713 15.8841 14.9019 16.0636C14.8326 16.2431 14.7285 16.4072 14.5957 16.5465C14.4629 16.6858 14.304 16.7976 14.128 16.8754C13.952 16.9533 13.7623 16.9957 13.5699 17.0002Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M15.39 4.5H2.5C2.36739 4.5 2.24021 4.44732 2.14645 4.35355C2.05268 4.25979 2 4.13261 2 4C2 3.86739 2.05268 3.74021 2.14645 3.64645C2.24021 3.55268 2.36739 3.5 2.5 3.5H15.39C15.5226 3.5 15.6498 3.55268 15.7436 3.64645C15.8373 3.74021 15.89 3.86739 15.89 4C15.89 4.13261 15.8373 4.25979 15.7436 4.35355C15.6498 4.44732 15.5226 4.5 15.39 4.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M10.5 6.5H11.5V14H10.5V6.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M6.5 6.5H7.5V14H6.5V6.5Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <path
        d="M10.5371 1.25L10.6787 1.27051C10.8172 1.30449 10.9444 1.37762 11.0439 1.48242C11.1765 1.62202 11.2502 1.80752 11.25 2V2.67969H10.7998V1.75H7.2002V2.67969H6.75V2L6.76367 1.85742C6.79052 1.71755 6.85665 1.58714 6.95605 1.48242C7.05562 1.37762 7.18281 1.30449 7.32129 1.27051L7.46289 1.25H10.5371Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

// make the component available to be imported into other components or files
export default MyApp;
