import express from 'express';
import cors from 'cors';
import {
  addTask,
  deleteTask,
  findTaskById,
  getTasks,
} from './task-services.js';

const app = express(); // setup api
const port = 8000; // port number

////////// SETUP //////////

app.use(cors());
app.use(express.json());

////////// GET //////////

app.get('/', (req, res) => {
  // HTTP GET request
  // main page
  res.send('Hello, world!!!!');
});

app.get('/tasks', (req, res) => {
  // sends list of tasks, filtered by a query if given one
  getTasks()
    .then((tasks) => res.status(200).json(tasks))
    .catch((error) => res.status(500).send(error));
});

app.get('/tasks/:id', (req, res) => {
  // /tasks/idValue
  // direct endpoint for resource
  findTaskById(req.params.id)
    .then((task) => (task ? res.status(200).json(task) : res.sendStatus(404)))
    .catch((error) => res.status(404).send(error));
});

////////// POST //////////

app.post('/tasks', (req, res) => {
  // add a task to the tasks list with a POST HTTP request
  addTask(req.body)
    .then((task) => res.status(201).json(task))
    .catch((error) => res.status(500).send(error));
});

////////// DELETE //////////

app.delete('/tasks/:id', (req, res) => {
  // curl -X DELETE http://localhost:8000/tasks/abc123
  // delete a task by id from the tasks list if it exists
  deleteTask(req.params.id)
    .then((task) =>
      task
        ? res.sendStatus(204)
        : res.status(404).send('Resource not found. Cannot delete.')
    )
    .catch((error) => res.status(500).send(error));
});

////////// listen //////////

app.listen(port, () => {
  // listen to HTTP requests on this port
  console.log(`Example app listening at http://localhost:${port}`);
});
