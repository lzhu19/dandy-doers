import taskModel from './task.js';

function getTasks(name) {
  let promise;
  if (!name) {
    promise = taskModel.find();
  } else {
    promise = findTaskByName(name);
  }
  return promise;
}

function findTaskById(id) {
  // /tasks/<id>
  return taskModel.findById(id);
}

function findTaskByName(name) {
  // /tasks?name=<name>
  return taskModel.find({ name: name });
}

function addTask(task) {
  // /tasks
  const taskToAdd = new taskModel(task);
  const promise = taskToAdd.save();
  return promise;
}

//finds a task by id & updates its name, then saves the change
function updateTask(id, updatedFields) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.name = updatedFields.name;
    return task.save();
  });
}

function archiveTask(id) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.archived = true;
    return task.save();
  });
}

function deleteTask(id) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.deleted = true;
    return task.save();
  });
}

function getArchivedTasks() {
  return taskModel.find({ archived: true });
}

function restoreArchivedTask(id) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.archived = false;
    return task.save();
  });
}

function restoreDeletedTask(id) {
  return taskModel.findById(id).then((task) => {
    if (!task) return null;
    task.deleted = false;
    return task.save();
  });
}

function getDeletedTasks() {
  return taskModel.find({ deleted: true });
}

export {
  getTasks,
  findTaskById,
  findTaskByName,
  addTask,
  updateTask,
  deleteTask,
  archiveTask,
  getArchivedTasks,
  restoreArchivedTask,
  restoreDeletedTask,
  getDeletedTasks,
};
