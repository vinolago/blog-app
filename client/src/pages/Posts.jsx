import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, User } from "lucide-react";
import api from "@/api/axios";

// Mock data - will be replaced with API calls
/*const mockPosts = [
  {
    id: "1",
    title: "Getting Started with React and TypeScript",
    excerpt:
      "Learn how to set up a modern React application with TypeScript for better type safety and developer experience.",
    author: "Sarah Chen",
    date: "2025-10-20",
    category: "React",
    readTime: "5 min read",
  },
  {
    id: "2",
    title: "Building RESTful APIs with Best Practices",
    excerpt:
      "Explore the principles of REST architecture and learn how to design scalable and maintainable APIs.",
    author: "Michael Rodriguez",
    date: "2025-10-18",
    category: "Backend",
    readTime: "8 min read",
  },
  {
    

const cats = ["All", "React", "Backend", "CSS", "Database", "JavaScript"]; */

const Posts = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);

        // Get all posts + categories
        const postResults = await api.get("/posts");
        const catResults = await api.get("/categories");

        if (postResults.data.success) {
          console.log('Posts loaded:', postResults.data.data);
          setPosts(postResults.data.data);
        } else {
          console.error('Failed to load posts:', postResults.data);
        }

        if (catResults.data.success) {
          // Add "All" option and map category names
          const categoryNames = ["All", ...catResults.data.data.map(cat => cat.name)];
          console.log('Categories loaded:', categoryNames);
          setCategories(categoryNames);
        } else {
          console.error('Failed to load categories:', catResults.data);
        }
      } catch (error) {
        console.error("Error fetching posts: ", error);
        setError("Failed to load posts. Please try again.");
        // Set empty arrays on error
        setPosts([]);
        setCategories(["All"]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

 // Filter posts by search + category
  const filteredPosts = posts.filter((post) => {
    const titleMatch = post.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const excerptMatch = post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || excerptMatch;

    const categoryName = post.category?.name || "";
    const matchesCategory =
      selectedCategory === "All" || categoryName === selectedCategory;

    return matchesSearch && matchesCategory;
  });
/*
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }); */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-muted-foreground">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading posts...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <span className="text-xl font-bold text-primary-foreground">B</span>
              </div>
              <span className="text-2xl font-bold">DevBlog</span>
            </Link>
            <Button asChild>
              <Link to="/posts/new">
                <Plus className="mr-2 h-4 w-4" />
                New Post
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight">Welcome to Dev Blog</h1>
          <p className="text-xl text-muted-foreground">
            Discover articles about web development, design, and technology
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="cursor-pointer transition-smooth hover:scale-105"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">
              {posts.length === 0 
                ? "No posts available. Create your first post!" 
                : "No posts found matching your criteria."
              }
            </p>
            {posts.length === 0 && (
              <Button asChild className="mt-4">
                <Link to="/posts/new">Create First Post</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <Link key={post._id} to={`/posts/${post._id}`}>
                <Card className="h-full transition-smooth hover:-translate-y-1 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="secondary">{post.category?.name || 'Uncategorized'}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {Math.ceil(post.content?.length / 200) || 5} min read
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author?.name || 'Unknown Author'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(post.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Posts;
