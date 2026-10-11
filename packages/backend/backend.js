import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import {
  getTasks,
  findTaskById,
  addTask,
  updateTask,
  deleteTask,
  permanentlyDeleteTask,
  archiveTask,
  getArchivedTasks,
  restoreArchivedTask,
  restoreDeletedTask,
  getDeletedTasks,
} from './task-services.js';
import {
  addList,
  deleteList,
  findListById,
  getLists,
  updateListName,
} from './list-services.js';

const app = express(); // setup api
const port = 8000; // port number

////////// SETUP //////////

app.use(cors());
app.use(express.json());

////////// GET //////////

app.get('/', (req, res) => {
  // HTTP GET request
  // main page
  res.send('Welcome to the Dandy Doers backend!');
});

app.get('/tasks', (req, res) => {
  // sends list of tasks, filtered by a query if given one
  getTasks(req.query.name)
    .then((tasks) => res.status(200).json(tasks))
    .catch((error) => {
      console.error('Unable to retrieve tasks: ', error);
      res.status(500).send('Unable to retrieve tasks.');
    });
});

app.get('/lists', (req, res) => {
  // gets all lists
  getLists()
    .then((lists) => res.status(200).json(lists))
    .catch((error) => {
      console.error('Unable to retrieve task lists: ', error);
      res.status(500).send('Unable to retrieve task lists.');
    });
});

app.get('/tasks/archived', (req, res) => {
  getArchivedTasks()
    .then((task) => (task ? res.status(200).json(task) : res.sendStatus(404)))
    .catch((error) => {
      console.error('Unable to retrieve archived tasks: ', error);
      res.status(500).send('Unable to retrieve archived tasks.');
    });
});

app.get('/tasks/deleted', (req, res) => {
  getDeletedTasks()
    .then((task) => (task ? res.status(200).json(task) : res.sendStatus(404)))
    .catch((error) => {
      console.error('Unable to retrieve deleted tasks: ', error);
      res.status(500).send('Unable to retrieve deleted tasks.');
    });
});

app.get('/tasks/:id', (req, res) => {
  // /tasks/idValue
  // direct endpoint for resource
  findTaskById(req.params.id)
    .then((task) => (task ? res.status(200).json(task) : res.sendStatus(404)))
    .catch((error) => {
      console.error('Task not found: ', error);
      res.status(500).send('Task not found.');
    });
});

app.get('/lists/:id', (req, res) => {
  findListById(req.params.id)
    .then((list) => (list ? res.status(200).json(list) : res.sendStatus(404)))
    .catch((error) => {
      console.error('List not found', error);
      res.status(500).send('List not found.');
    });
});

////////// POST //////////

app.post('/tasks', (req, res) => {
  // add a task to a list
  const { name, listId } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    name.trim().length === 0 ||
    !mongoose.isObjectIdOrHexString(listId)
  ) {
    return res.status(400).send('Task name and a valid listId are required.');
  }

  findListById(listId)
    .then((list) => {
      if (!list) {
        res.status(400).send('The specified list does not exist.');
        return null;
      }
      return addTask({ name, listId: list._id });
    })
    .then((task) => {
      if (task) res.status(201).json(task);
    })
    .catch((error) => {
      console.error('Could not add task to task list: ', error);
      res.status(500).send('Could not add task to task list.');
    });
});

app.post('/lists', (req, res) => {
  // add a list with a list name
  const { name } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).send('A non-empty list name is required.');
  }

  addList({ name })
    .then((list) => res.status(201).json(list))
    .catch((error) => {
      console.error('Could not add list: ', error);
      res.status(500).send('Could not add list.');
    });
});

////////// DELETE //////////

app.delete('/tasks/:id', (req, res) => {
  permanentlyDeleteTask(req.params.id)
    .then((task) =>
      task
        ? res.sendStatus(204)
        : res.status(404).send('Task not found. Cannot delete.')
    )
    .catch((error) => {
      console.error('Could not delete task: ', error);
      res.status(500).send('Could not delete task.');
    });
});

app.delete('/lists/:id', (req, res) => {
  deleteList(req.params.id)
    .then((list) =>
      list
        ? res.sendStatus(204)
        : res.status(404).send('List not found. Cannot delete.')
    )
    .catch((error) => {
      console.error('Could not delete list: ', error);
      res.status(500).send('Could not delete list.');
    });
});

////////// PUT //////////

app.put('/tasks/:id', (req, res) => {
  // curl -X PUT http://localhost:8000/tasks/abc123
  // updates a task's name by id
  updateTask(req.params.id, req.body)
    .then((task) =>
      task
        ? res.status(200).json(task)
        : res.status(404).send('Task not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not update task name: ', error);
      res.status(500).send('Could not update task name.');
    });
});

app.put('/lists/:id', (req, res) => {
  // updates list name with a given list id and list name
  updateListName(req.params.id, req.body)
    .then((list) =>
      list
        ? res.status(200).json(list)
        : res.status(404).send('List not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not update list name: ', error);
      res.status(500).send('Could not update list name.');
    });
});

app.put('/tasks/:id/archive', (req, res) => {
  // curl -X PUT http://localhost:8000/tasks/abc123
  // archives a task's name by id
  archiveTask(req.params.id)
    .then((task) =>
      task
        ? res.status(200).json(task)
        : res.status(404).send('Task not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not archive task: ', error);
      res.status(500).send('Could not archive task.');
    });
});

app.put('/tasks/:id/delete', (req, res) => {
  // curl -X PUT http://localhost:8000/tasks/abc123
  // delete a task's name by id
  deleteTask(req.params.id)
    .then((task) =>
      task
        ? res.status(200).json(task)
        : res.status(404).send('Resource not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not delete task: ', error);
      res.status(500).send('Could not delete task.');
    });
});

app.put('/tasks/:id/restore-archived', (req, res) => {
  // curl -X PUT http://localhost:8000/tasks/abc123
  // restores an archived task's name by id
  restoreArchivedTask(req.params.id)
    .then((task) =>
      task
        ? res.status(200).json(task)
        : res.status(404).send('Resource not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not restore archived task: ', error);
      res.status(500).send('Could not restore archived task.');
    });
});

app.put('/tasks/:id/restore-deleted', (req, res) => {
  // curl -X PUT http://localhost:8000/tasks/abc123
  // restores an deleted task's name by id
  restoreDeletedTask(req.params.id)
    .then((task) =>
      task
        ? res.status(200).json(task)
        : res.status(404).send('Resource not found. Cannot update.')
    )
    .catch((error) => {
      console.error('Could not restore deleted task: ', error);
      res.status(500).send('Could not restore deleted task.');
    });
});

////////// listen //////////

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    mongoose.set('debug', true);

    app.listen(port, () => {
      console.log(`Example app listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB:', error);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  startServer();
}

export { startServer };
export default app;
