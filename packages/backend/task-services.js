import mongoose from 'mongoose';
import taskModel from './task.js';
import 'dotenv/config';

mongoose.set('debug', true);

mongoose.connect(process.env.MONGODB_URI).catch((error) => console.log(error));

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

//finds a task by id & updates its name, then saves the change
function updateTask(id, updatedFields) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.name = updatedFields.name;
    return task.save();
  });
}

export { addTask, deleteTask, findTaskById, getTasks, updateTask };
