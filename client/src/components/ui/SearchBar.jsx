// src/components/ui/SearchBar.jsx
import { useEffect, useState } from "react";

export default function SearchBar({ onSearch, initialValue = "" }) {
  const [value, setValue] = useState(initialValue);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);

    if (typingTimeout) clearTimeout(typingTimeout);
    // debounce 400ms
    setTypingTimeout(
      setTimeout(() => {
        onSearch(v.trim());
      }, 400)
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typingTimeout) clearTimeout(typingTimeout);
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-center gap-2">
        <input
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Search posts, tags or authors..."
          className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Search posts"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
        >
          Search
        </button>
      </div>
    </form>
  );
}
