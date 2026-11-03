const STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export default function Filters({ filters, onChange, onReset, canReset }) {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target ? e.target.value : e });

  return (
    <section className="filters" data-cy="filters">
      <div className="tabs" role="tablist" aria-label="Filter by status">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            role="tab"
            aria-selected={filters.status === s.value}
            className={`tab ${filters.status === s.value ? 'active' : ''}`}
            onClick={() => onChange({ ...filters, status: s.value })}
            data-cy={`filter-${s.value}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="filter-controls">
        <input
          type="search"
          className="search"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={set('search')}
          aria-label="Search tasks"
          data-cy="filter-search"
        />
        <select value={filters.priority} onChange={set('priority')} aria-label="Filter by priority" data-cy="filter-priority">
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filters.sort} onChange={set('sort')} aria-label="Sort tasks" data-cy="filter-sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
        </select>
        {canReset && (
          <button className="btn btn-ghost btn-sm" onClick={onReset} data-cy="filter-reset">Clear</button>
        )}
      </div>
    </section>
  );
}
