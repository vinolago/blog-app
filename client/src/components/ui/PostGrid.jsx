// src/components/ui/PostGrid.jsx
import { useEffect, useState } from "react";
import PostCard from "./PostCard";

function buildQuery({ search, category, page, limit }) {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);
  return params.toString() ? `?${params.toString()}` : "";
}

export default function PostGrid({ search = "", category = "", page = 1, limit = 10 }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = buildQuery({ search, category, page, limit });
        const res = await fetch(`/api/posts${q}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Failed to fetch posts: ${res.status}`);
        }
        const json = await res.json();
        // expected server response: { success, count, total, currentPage, totalPages, data }
        if (mounted) {
          setPosts(json.data || []);
          setTotalPages(json.totalPages || 1);
          setTotalItems(json.total || (json.count ?? 0));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Unknown error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPosts();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [search, category, page, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-48 bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!posts || posts.length === 0) {
    return <div className="text-center py-12 text-gray-600">No posts found.</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post._id || post.slug} post={post} />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {posts.length} of {totalItems} posts
        </div>

        <div className="flex items-center gap-2">
          {/* Simple Previous / Next controls (could be replaced by a full Pagination) */}
          <button
            onClick={() => {
              const prev = Math.max(1, page - 1);
              const evt = new CustomEvent("pageChange", { detail: prev });
              window.dispatchEvent(evt);
            }}
            disabled={page <= 1}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          <div className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </div>

          <button
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              const evt = new CustomEvent("pageChange", { detail: next });
              window.dispatchEvent(evt);
            }}
            disabled={page >= totalPages}
            className="px-3 py-1 rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
