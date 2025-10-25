// src/components/ui/CategoryBadge.jsx
export default function CategoryBadge({ label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
        active
          ? "bg-sky-600 text-white border-sky-600"
          : "bg-white text-slate-700 border-gray-200 hover:bg-gray-50"
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
