import mongoose from 'mongoose';
import taskModel from './task.js';

mongoose.set('debug', true);

mongoose
  .connect('mongodb://localhost:27017/tasks')
  .catch((error) => console.log(error));

function getTasks(name, job) {
  let promise;
  if (name === undefined && job === undefined) {
    // /tasks
    promise = taskModel.find();
  } else if (name && !job) {
    // /tasks?name=<name>
    promise = findTaskByName(name);
  } else if (job && !name) {
    // /tasks?job=<job>
    promise = findTaskByJob(job);
  } else if (job && name) {
    // /tasks?name=<name>&job=<job>
    promise = findTaskByNameAndJob(name, job);
  }
  return promise;
}

function findTaskById(id) {
  // /tasks/<id>
  return taskModel.findById(id);
}

function addTask(task) {
  // /tasks
  const taskToAdd = new taskModel(task);
  const promise = taskToAdd.save();
  return promise;
}

function findTaskByName(name) {
  // /tasks?name=<name>
  return taskModel.find({ name: name });
}

function findTaskByJob(job) {
  // /tasks?job=<job>
  return taskModel.find({ job: job });
}

function findTaskByNameAndJob(name, job) {
  // /tasks?name=<name>&job=<job>
  return taskModel.find({ name: name, job: job });
}

function deleteTask(id) {
  // /tasks/<id>
  return taskModel.findByIdAndDelete(id);
}

export { addTask, deleteTask, findTaskById, getTasks };
