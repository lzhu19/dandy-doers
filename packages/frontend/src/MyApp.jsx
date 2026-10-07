import { useState, useEffect } from 'react';
import Table from './Table';
import Form from './Form';
import ArchiveList from './ArchiveList';

function MyApp() {
  const [tasks, setTasks] = useState([]);
  //starts as null, when user clicks set EditingId to the task's id
  const [editingId, setEditingId] = useState(null);

  const [archivedTasks, setArchivedTasks] = useState([]);


  function fetchTasks() {
    const promise = fetch('http://localhost:8000/tasks');
    return promise;
  }

  function postTask(job) {
    const promise = fetch('http://localhost:8000/tasks', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(job),
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
          setArchivedTasks((currentArchivedTasks) => [...currentArchivedTasks, archivedTask,]);
          setTasks((currentTasks) =>
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
    const promise = fetch(`http://localhost:8000/tasks/${id}/restore-archived`, {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ archived: false }),
    });

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
        setTasks(tasks.filter((task) => task.archived !== true));
        setArchivedTasks(tasks.filter((task) => task.archived === true));
    })
      .catch((error) => {
        console.log(error);
      });
  }, []); // empty array here indicates that hook should be called only when component first mounts

  return (
    <div className="container">
      <Table
        taskData={tasks}
        removeTask={removeOneTask}
        updateTask={updateOneTask}
        archiveTask={archiveTask}
        editingId={editingId}
        setEditingId={setEditingId}

      />
      <Form handleSubmit={updateList} />
      <ArchiveList
        archivedTasks={archivedTasks}
        restoreArchivedTask={restoreArchivedTask}
        removeTask={removeOneTask}
      />
    </div>
  );
}

// make the component available to be imported into other components or files
export default MyApp;
