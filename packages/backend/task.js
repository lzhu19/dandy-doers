import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    job: {
      type: String,
      required: true,
      trim: true,
      validate(value) {
        if (value.length < 2)
          throw new Error('Invalid job, must be at least 2 characters.');
      },
    },
  },
  { collection: 'tasks_list' }
);

const Task = mongoose.model('Task', TaskSchema);

export default Task;
