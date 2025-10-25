import { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import api from "@/api/axios";

// Categories will be fetched from backend
const defaultCategories = ["React", "Backend", "CSS", "Database", "JavaScript", "TypeScript"];

const PostForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    author: "", // Will be replaced with actual auth user
    featuredImage: "",
    tags: [],
    isPublished: true,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (user !== undefined) { // user is loaded (either null or user object)
      setAuthLoading(false);
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create or edit posts.",
          variant: "destructive"
        });
        navigate("/login");
      }
    }
  }, [user, navigate, toast]);

  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        if (response.data.success && response.data.data.length > 0) {
          setCategories(response.data.data);
        } else {
          setCategories(defaultCategories.map(name => ({ _id: name, name })));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // Keep default categories if fetch fails
        setCategories(defaultCategories.map(name => ({ _id: name, name })));
      }
    };

    fetchCategories();
  }, []);

  // Load post data for editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/posts/${id}`);
          if (response.data.success) {
            const post = response.data.data;
            setFormData({
              title: post.title || "",
              excerpt: post.excerpt || "",
              content: post.content || "",
              category: post.category?.name || "",
              author: post.author || "",
              featuredImage: post.featuredImage || "",
              tags: post.tags || [],
              isPublished: post.isPublished || false,
            });
          }
        } catch (error) {
          toast({
            title: "Error loading post",
            description: "Failed to load post data for editing.",
            variant: "destructive"
          });
          navigate("/posts");
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [isEditing, id, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Enhanced validation
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim() || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate excerpt length
    if (formData.excerpt.length > 200) {
      toast({
        title: "Validation Error",
        description: "Excerpt cannot exceed 200 characters.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    // Validate title length
    if (formData.title.length > 100) {
      toast({
        title: "Validation Error",
        description: "Title cannot exceed 100 characters.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    try {
      // Prepare data for submission
      const submitData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category: formData.category,
        author: user?.id || import.meta.env.VITE_FAKE_USER_ID, // Use authenticated user ID
        featuredImage: formData.featuredImage || "",
        tags: formData.tags || [],
        isPublished: formData.isPublished,
      };

      let response;
      if (isEditing) {
        // Update existing post
        response = await api.put(`/posts/${id}`, submitData);
      } else {
        // Create new post
        response = await api.post("/posts", submitData);
      }

      if (response.data.success) {
        toast({
          title: isEditing ? "Post Updated" : "Post Created",
          description: isEditing
            ? "Your post has been successfully updated."
            : "Your post has been successfully published."
        });
        navigate("/posts");
      } else {
        throw new Error(response.data.error || `Failed to ${isEditing ? 'update' : 'create'} post`);
      }
    } catch (error) {
      console.error('API Error:', error);
      toast({
        title: `Error ${isEditing ? 'updating' : 'creating'} post`,
        description: error.response?.data?.error || error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" asChild>
            <Link to="/posts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="content-container">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">
                {isEditing ? "Edit Post" : "Create New Post"}
              </CardTitle>
              <CardDescription>
                {isEditing
                  ? "Update your blog post with the latest information."
                  : "Share your knowledge with the developer community."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter an engaging title for your post"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    maxLength={100}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.title.length}/100 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt *</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Write a brief summary that will appear in the post list"
                    value={formData.excerpt}
                    onChange={(e) => handleChange("excerpt", e.target.value)}
                    rows={3}
                    maxLength={200}
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.excerpt.length}/200 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleChange("category", value)}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here... You can use Markdown formatting."
                    value={formData.content}
                    onChange={(e) => handleChange("content", e.target.value)}
                    rows={16}
                    className="font-mono"
                    required
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Tip: You can use Markdown syntax for formatting (headings, lists, code blocks, etc.)
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button type="submit" size="lg" disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {loading 
                      ? (isEditing ? "Updating..." : "Publishing...") 
                      : (isEditing ? "Update Post" : "Publish Post")
                    }
                  </Button>
                  <Button type="button" variant="outline" size="lg" asChild disabled={loading}>
                    <Link to="/posts">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PostForm;
