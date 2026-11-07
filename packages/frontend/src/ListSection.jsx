function ListSection({
  lists,
  selectedListId,
  onSelectList,
  setSelectedTaskId,
}) {
  return (
    <details className="lists-section">
      <summary className="sidebar-section-title">Lists</summary>
      <ul>
        {lists.map((list) => (
          <li className="user-list" key={list._id}>
            <button
              className="user-list-select"
              type="button"
              aria-current={list._id === selectedListId ? 'page' : undefined}
              onClick={() => {
                onSelectList(list._id);
                setSelectedTaskId([]);
              }}
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
