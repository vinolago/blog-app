// src/pages/Home.jsx
import { useState } from "react";
import PostGrid from "../components/ui/PostGrid";
import SearchBar from "../components/ui/SearchBar";
import CategoryBadge from "../components/ui/CategoryBadge";
import Pagination from "../components/ui/pagination";

const CATEGORIES = [
  { id: "", label: "All" },
  { id: "technology", label: "Technology" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" },
];

export default function Home() {
  // Controlled state for filters + pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(""); // category slug or id
  const [page, setPage] = useState(1);
  const limit = 10;

  const onSearch = (value) => {
    setSearch(value);
    setPage(1); // reset to first page when searching
  };

  const onSelectCategory = (catId) => {
    setCategory(catId);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-semibold">Latest Posts</h1>

        <div className="w-full md:w-1/2">
          <SearchBar onSearch={onSearch} initialValue={search} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <CategoryBadge
            key={c.id || "all"}
            label={c.label}
            active={category === c.id}
            onClick={() => onSelectCategory(c.id)}
            slug={c.id}
          />
        ))}
      </div>

      <PostGrid search={search} category={category} page={page} limit={limit} />

      <div className="pt-4">
        <Pagination
          page={page}
          setPage={setPage}
          // PostGrid will expose totalPages via localStorage pattern OR
          // we request total from API by calling same query — here we let PostGrid
          // accept a callback to update totalPages. Simpler: fetch pages inside PostGrid
          // and store pages in PostGrid state — but we still allow user to control page.
        />
      </div>
    </div>
  );
}

