import taskModel from './task.js';
import listModel from './list.js';

function getLists() {
  return listModel.find();
}

function findListById(id) {
  return listModel.findById(id);
}

function addList(list) {
  const listToAdd = new listModel(list);
  return listToAdd.save();
}

function updateListName(id, updatedName) {
  return listModel.findById(id).then((list) => {
    if (!list) return null;
    list.name = updatedName.name;
    return list.save();
  });
}

async function deleteList(id) {
  const list = await listModel.findById(id);
  if (!list) return null;

  // delete all tasks before deleting list to prevent orphaned tasks
  await taskModel.deleteMany({ listId: list._id });
  return listModel.findByIdAndDelete(list._id);
}

export { getLists, findListById, addList, updateListName, deleteList };
