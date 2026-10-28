import taskModel from './task.js';

function getTasks(name) {
  let promise;
  if (!name) {
    promise = taskModel.find().sort({ position: 1 });
  } else {
    promise = findTaskByName(name);
  }
  return promise;
}

async function reorderTasks(listId, taskIds) {
  // Find all tasks in the specified list
  const tasks = await taskModel.find({
    listId: listId,
    archived: false,
    deleted: false,
  });

  // Verify that the submitted IDs represent every task in the list
  const existingIds = tasks.map((task) => task._id.toString());
  const submittedIds = taskIds.map((id) => String(id));

  if (
    existingIds.length !== submittedIds.length ||
    !existingIds.every((id) => submittedIds.includes(id)) ||
    new Set(submittedIds).size !== submittedIds.length
  ) {
    throw new Error(
      'Task IDs must represent every task in the list exactly once.'
    );
  }

  // Create an update operation for each task
  const operations = taskIds.map((taskId, index) => ({
    updateOne: {
      filter: {
        _id: taskId,
        listId: listId,
      },
      update: {
        $set: { position: index },
      },
    },
  }));

  // Save the new positions in MongoDB
  await taskModel.bulkWrite(operations);

  // Return the tasks in their new order
  return taskModel.find({ listId: listId }).sort({ position: 1 });
}

function findTaskById(id) {
  // /tasks/<id>
  return taskModel.findById(id);
}

function findTaskByName(name) {
  // /tasks?name=<name>
  return taskModel.find({ name: name }).sort({ position: 1 });
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
    if (updatedFields.name !== undefined) task.name = updatedFields.name;
    if (updatedFields.notes !== undefined) task.notes = updatedFields.notes;
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

function permanentlyDeleteTask(id) {
  return taskModel.findOneAndDelete({ _id: id, deleted: true });
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
  permanentlyDeleteTask,
  archiveTask,
  getArchivedTasks,
  reorderTasks,
  restoreArchivedTask,
  restoreDeletedTask,
  getDeletedTasks,
};
