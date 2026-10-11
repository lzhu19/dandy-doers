import mongoose from 'mongoose';

const ListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { collection: 'todo_lists' }
);

const List = mongoose.model('List', ListSchema);

export default List;
