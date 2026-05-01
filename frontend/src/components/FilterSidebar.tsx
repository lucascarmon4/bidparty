export interface Filters {
  categories: string[];
  statuses: string[];
  maxPrice: number;
  dateRange: string;
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  availableCategories: string[];
}

const STATUSES: { value: string; label: string }[] = [
  { value: 'live', label: 'Ao Vivo' },
  { value: 'upcoming', label: 'Agendada' },
  { value: 'ended', label: 'Encerrada' },
];

export default function FilterSidebar({ filters, onChange, availableCategories }: Props) {
  const toggle = (key: 'categories' | 'statuses', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  return (
    <aside className="bg-[#1a1b2e] border border-[#2a2b45] rounded-xl p-4 w-48 shrink-0 self-start sticky top-20">
      <div className="flex items-center gap-2 mb-5">
        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        <span className="text-white font-semibold">Filtros</span>
      </div>

      {availableCategories.length > 0 && (
        <div className="mb-5">
          <p className="text-white text-sm font-medium mb-2">Categoria</p>
          {availableCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.categories.includes(cat)}
                onChange={() => toggle('categories', cat)}
                className="accent-purple-500 w-4 h-4"
              />
              <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      )}

      <div className="mb-5">
        <p className="text-white text-sm font-medium mb-2">Situação</p>
        {STATUSES.map((s) => (
          <label key={s.value} className="flex items-center gap-2 py-1 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.statuses.includes(s.value)}
              onChange={() => toggle('statuses', s.value)}
              className="accent-purple-500 w-4 h-4"
            />
            <span className="text-gray-300 text-sm group-hover:text-white transition-colors">{s.label}</span>
          </label>
        ))}
      </div>

      <div className="mb-5">
        <p className="text-white text-sm font-medium mb-2">Lance Máximo</p>
        <input
          type="range"
          min={0}
          max={10000}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-gray-400 text-xs mt-1">
          <span>R$ 0</span>
          <span>R$ 10.000+</span>
        </div>
      </div>

      <div>
        <p className="text-white text-sm font-medium mb-2">Data</p>
        <select
          value={filters.dateRange}
          onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
          className="w-full bg-[#0d0e1a] border border-[#2a2b45] text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
        >
          <option value="">Qualquer data</option>
          <option value="today">Hoje</option>
          <option value="week">Esta semana</option>
          <option value="month">Este mês</option>
        </select>
      </div>
    </aside>
  );
}
