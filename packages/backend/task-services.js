import mongoose from 'mongoose';
import taskModel from './task.js';

mongoose.set('debug', true);

mongoose
  .connect('mongodb://localhost:27017/tasks')
  .catch((error) => console.log(error));

function getTasks(name) {
  let promise;
  if (name === undefined) {
    // /tasks
    promise = taskModel.find();
  } else if (name) {
    //&& !job
    // /tasks?name=<name>
    promise = findTaskByName(name);
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

function deleteTask(id) {
  // /tasks/<id>
  return taskModel.findByIdAndDelete(id);
}

export { addTask, deleteTask, findTaskById, getTasks };
