import mongoose from 'mongoose';
import userModel from './user.js';

mongoose.set('debug', true);

mongoose
  .connect('mongodb://localhost:27017/users')
  .catch((error) => console.log(error));

function getUsers(name, job) {
  let promise;
  if (name === undefined && job === undefined) {
    // /users
    promise = userModel.find();
  } else if (name && !job) {
    // /users?name=<name>
    promise = findUserByName(name);
  } else if (job && !name) {
    // /users?job=<job>
    promise = findUserByJob(job);
  } else if (job && name) {
    // /users?name=<name>&job=<job>
    promise = findUserByNameAndJob(name, job);
  }
  return promise;
}

function findUserById(id) {
  // /users/<id>
  return userModel.findById(id);
}

function addUser(user) {
  // /users
  const userToAdd = new userModel(user);
  const promise = userToAdd.save();
  return promise;
}

function findUserByName(name) {
  // /users?name=<name>
  return userModel.find({ name: name });
}

function findUserByJob(job) {
  // /users?job=<job>
  return userModel.find({ job: job });
}

function findUserByNameAndJob(name, job) {
  // /users?name=<name>&job=<job>
  return userModel.find({ name: name, job: job });
}

function deleteUser(id) {
  // /users/<id>
  return userModel.findByIdAndDelete(id);
}

export { addUser, deleteUser, findUserById, getUsers };
