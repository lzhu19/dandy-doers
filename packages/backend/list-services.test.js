// unit tests for list-services.js
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import mockingoose from 'mockingoose';
import List from './list.js';
import Task from './task.js';
import {
  getLists,
  findListById,
  addList,
  updateListName,
  deleteList,
} from './list-services.js';

const listId = '507f1f77bcf86cd799439011';
const listName = 'My Tasks';
const sampleList = { _id: listId, name: listName };

afterEach(() => {
  mockingoose.resetAll();
  jest.restoreAllMocks();
});

describe('getLists', () => {
  it('returns all lists', async () => {
    mockingoose(List).toReturn((query) => {
      expect(query.getQuery()).toEqual({});
      return [sampleList];
    }, 'find');

    const lists = await getLists();

    expect(lists).toHaveLength(1);
    expect(lists[0].name).toBe(listName);
    expect(lists[0]._id.toString()).toBe(listId);
  });

  it('returns an empty array when no lists exist', async () => {
    mockingoose(List).toReturn([], 'find');

    await expect(getLists()).resolves.toEqual([]);
  });

  it('propagates an error when retrieving lists fails', async () => {
    mockingoose(List).toReturn(new Error('List query failed'), 'find');

    await expect(getLists()).rejects.toThrow('List query failed');
  });
});

describe('findListById', () => {
  it('returns the list with the given ID', async () => {
    mockingoose(List).toReturn((query) => {
      expect(query.getQuery()._id.toString()).toBe(listId);
      return sampleList;
    }, 'findOne');

    const list = await findListById(listId);

    expect(list).not.toBeNull();
    expect(list.name).toBe(listName);
    expect(list._id.toString()).toBe(listId);
  });

  it('returns null when no list matches the given ID', async () => {
    mockingoose(List).toReturn(null, 'findOne');

    await expect(findListById(listId)).resolves.toBeNull();
  });

  it('propagates an error when the list lookup fails', async () => {
    mockingoose(List).toReturn(new Error('List lookup failed'), 'findOne');

    await expect(findListById(listId)).rejects.toThrow('List lookup failed');
  });
});

describe('addList', () => {
  it('saves and returns a list', async () => {
    mockingoose(List).toReturn(sampleList, 'save');

    const list = await addList({ name: listName });

    expect(list.name).toBe(listName);
    expect(list._id.toString()).toBe(listId);
  });

  it('propagates an error when saving a list fails', async () => {
    mockingoose(List).toReturn(new Error('List save failed'), 'save');

    await expect(addList({ name: listName })).rejects.toThrow(
      'List save failed'
    );
  });

  it('rejects a list with no name', async () => {
    jest.spyOn(List.prototype, 'save').mockImplementation(function () {
      return this.validate().then(() => this);
    });

    await expect(addList({})).rejects.toThrow('List validation failed');
  });

  it.each(['', '   '])('rejects a list with name %j', async (name) => {
    jest.spyOn(List.prototype, 'save').mockImplementation(function () {
      return this.validate().then(() => this);
    });

    await expect(addList({ name })).rejects.toThrow('List validation failed');
  });
});

describe('updateListName', () => {
  const updatedName = 'Work';

  it('updates and returns the list name', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(List).toReturn({ _id: listId, name: updatedName }, 'save');

    const list = await updateListName(listId, { name: updatedName });

    expect(list.name).toBe(updatedName);
    expect(list._id.toString()).toBe(listId);
  });

  it('returns null when no list matches the given ID', async () => {
    mockingoose(List).toReturn(null, 'findOne');

    await expect(
      updateListName(listId, { name: updatedName })
    ).resolves.toBeNull();
  });

  it('propagates an error when looking up the list fails', async () => {
    mockingoose(List).toReturn(new Error('List lookup failed'), 'findOne');

    await expect(updateListName(listId, { name: updatedName })).rejects.toThrow(
      'List lookup failed'
    );
  });

  it('propagates an error when saving the updated list fails', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(List).toReturn(new Error('List update failed'), 'save');

    await expect(updateListName(listId, { name: updatedName })).rejects.toThrow(
      'List update failed'
    );
  });

  it.each(['', '   '])('rejects an updated list name of %j', async (name) => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    jest.spyOn(List.prototype, 'save').mockImplementation(function () {
      return this.validate().then(() => this);
    });

    await expect(updateListName(listId, { name })).rejects.toThrow(
      'List validation failed'
    );
  });
});

describe('deleteList', () => {
  it('deletes tasks in the list and then deletes the list', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery().listId.toString()).toBe(listId);
      return { acknowledged: true, deletedCount: 2 };
    }, 'deleteMany');
    mockingoose(List).toReturn((query) => {
      expect(query.getQuery()._id.toString()).toBe(listId);
      return sampleList;
    }, 'findOneAndDelete');

    const deletedList = await deleteList(listId);

    expect(deletedList.name).toBe(sampleList.name);
    expect(deletedList._id.toString()).toBe(listId);
  });

  it('deletes the selected list when another list has the same name', async () => {
    const otherListId = '507f191e810c19729de860ea';
    const sameNameLists = [sampleList, { _id: otherListId, name: listName }];

    mockingoose(List).toReturn((query) => {
      const requestedId = query.getQuery()._id.toString();
      const selectedList = sameNameLists.find(
        (list) => list._id === requestedId
      );
      expect(selectedList).toBeDefined();
      return selectedList;
    }, 'findOne');
    mockingoose(Task).toReturn((query) => {
      expect(query.getQuery().listId.toString()).toBe(listId);
      return { acknowledged: true, deletedCount: 1 };
    }, 'deleteMany');
    mockingoose(List).toReturn((query) => {
      expect(query.getQuery()._id.toString()).toBe(listId);
      return sampleList;
    }, 'findOneAndDelete');

    const deletedList = await deleteList(listId);

    expect(deletedList._id.toString()).toBe(listId);
    expect(sameNameLists.find((list) => list._id === otherListId)).toEqual({
      _id: otherListId,
      name: deletedList.name,
    });
  });

  it('returns null when no list matches the given ID', async () => {
    mockingoose(List).toReturn(null, 'findOne');

    await expect(deleteList(listId)).resolves.toBeNull();
  });

  it('propagates an error when looking up the list fails', async () => {
    mockingoose(List).toReturn(new Error('List lookup failed'), 'findOne');

    await expect(deleteList(listId)).rejects.toThrow('List lookup failed');
  });

  it('propagates an error when deleting tasks fails', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(Task).toReturn(new Error('Task deletion failed'), 'deleteMany');

    await expect(deleteList(listId)).rejects.toThrow('Task deletion failed');
  });

  it('propagates an error when deleting the list fails', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(Task).toReturn(
      { acknowledged: true, deletedCount: 0 },
      'deleteMany'
    );
    mockingoose(List).toReturn(
      new Error('List deletion failed'),
      'findOneAndDelete'
    );

    await expect(deleteList(listId)).rejects.toThrow('List deletion failed');
  });

  it('returns null if the list disappears before it is deleted', async () => {
    mockingoose(List).toReturn(sampleList, 'findOne');
    mockingoose(Task).toReturn(
      { acknowledged: true, deletedCount: 0 },
      'deleteMany'
    );
    mockingoose(List).toReturn(null, 'findOneAndDelete');

    await expect(deleteList(listId)).resolves.toBeNull();
  });
});
