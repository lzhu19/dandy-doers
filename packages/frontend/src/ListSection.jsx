function ListSection({ lists, selectedListId, onSelectList }) {
  return (
    <details className="lists-section">
      <summary>My Lists</summary>
      <ul>
        {lists.map((list) => (
          <li className="user-list" key={list._id}>
            <button
              className="user-list-select"
              type="button"
              aria-current={list._id === selectedListId ? 'page' : undefined}
              onClick={() => onSelectList(list._id)}
            >
              {list.name}
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default ListSection;
