// src/components/ui/PostCard.jsx
import { Link } from "react-router-dom";

export default function PostCard({ post }) {
  const {
    title,
    excerpt,
    featuredImage,
    slug,
    author,
    category,
    createdAt,
  } = post;

  const imageUrl = featuredImage ? `/uploads/${featuredImage}` : "/uploads/default-post.jpg";
  const authorName = author?.name || (author && author.toString?.()) || "Unknown";
  const categoryName = category?.name || (category && category.toString?.()) || "";

  return (
    <article className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <Link to={`/post/${slug || post._id}`} className="block">
        <div className="h-44 w-full overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transform hover:scale-105 transition duration-300"
            loading="lazy"
            onError={(e) => (e.target.src = "/uploads/default-post.jpg")}
          />
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/post/${slug || post._id}`} className="text-xl font-semibold hover:underline block mb-2">
          {title}
        </Link>

        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{excerpt || excerptFallback(post.content)}</p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <div>{categoryName && <span className="px-2 py-1 bg-gray-100 rounded text-xs">{categoryName}</span>}</div>
            <div>By <span className="font-medium text-gray-700">{authorName}</span></div>
          </div>

          <time dateTime={createdAt} className="text-xs">{formatDate(createdAt)}</time>
        </div>
      </div>
    </article>
  );
}

function excerptFallback(content = "") {
  if (!content) return "";
  return content.slice(0, 140) + (content.length > 140 ? "..." : "");
}

function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString();
}
