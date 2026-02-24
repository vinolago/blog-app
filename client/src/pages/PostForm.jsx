import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import api from "@/api/axios";

const defaultCategories = [
  "React",
  "Backend",
  "CSS",
  "Database",
  "JavaScript",
  "TypeScript",
];

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
    featuredImage: "",
    tags: [],
    isPublished: false,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  /* ---------------- AUTH CHECK ---------------- */

  useEffect(() => {
    if (user !== undefined) {
      setAuthLoading(false);
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create or edit posts.",
          variant: "destructive",
        });
        navigate("/login");
      }
    }
  }, [user, navigate, toast]);

  /* ---------------- FETCH CATEGORIES ---------------- */

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        if (response.data.success && response.data.data.length > 0) {
          setCategories(response.data.data);
        } else {
          setCategories(defaultCategories.map((name) => ({ _id: name, name })));
        }
      } catch {
        setCategories(defaultCategories.map((name) => ({ _id: name, name })));
      }
    };

    fetchCategories();
  }, []);

  /* ---------------- LOAD POST FOR EDIT ---------------- */

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
              category: post.category?._id || "",
              featuredImage: post.featuredImage || "",
              tags: post.tags || [],
              isPublished: post.isPublished || false,
            });
          }
        } catch {
          toast({
            title: "Error loading post",
            description: "Failed to load post data.",
            variant: "destructive",
          });
          navigate("/posts");
        } finally {
          setLoading(false);
        }
      };

      fetchPost();
    }
  }, [id, isEditing, navigate, toast]);

  /* ---------------- HELPERS ---------------- */

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const wordCount = useMemo(() => {
    return formData.content.trim()
      ? formData.content.trim().split(/\s+/).length
      : 0;
  }, [formData.content]);

  const validate = () => {
    if (
      !formData.title.trim() ||
      !formData.excerpt.trim() ||
      !formData.content.trim() ||
      !formData.category
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.title.length > 100) {
      toast({
        title: "Validation Error",
        description: "Title cannot exceed 100 characters.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.excerpt.length > 200) {
      toast({
        title: "Validation Error",
        description: "Excerpt cannot exceed 200 characters.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const submitPost = async (publish) => {
    if (!validate()) return;

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        isPublished: publish,
        author: user?.id,
      };

      let response;
      if (isEditing) {
        response = await api.put(`/posts/${id}`, submitData);
      } else {
        response = await api.post("/posts", submitData);
      }

      if (response.data.success) {
        toast({
          title: publish
            ? isEditing
              ? "Post Updated"
              : "Post Published"
            : "Draft Saved",
        });
        navigate("/posts");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOADING STATES ---------------- */

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button variant="ghost" asChild>
            <Link to="/posts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => submitPost(false)}
              disabled={loading}
            >
              Save Draft
            </Button>

            <Button
              onClick={() => submitPost(true)}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading
                ? "Saving..."
                : isEditing
                ? "Update & Publish"
                : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-12">
          {/* LEFT: MAIN EDITOR */}
          <div className="col-span-2 space-y-8">
            <Input
              placeholder="Post title..."
              value={formData.title}
              onChange={(e) =>
                handleChange("title", e.target.value)
              }
              maxLength={100}
              className="text-4xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
            />

            <Textarea
              placeholder="Write your story... Markdown supported."
              value={formData.content}
              onChange={(e) =>
                handleChange("content", e.target.value)
              }
              rows={18}
              className="text-lg leading-relaxed border-none shadow-none px-0 focus-visible:ring-0 resize-none"
            />

            <p className="text-sm text-muted-foreground">
              {wordCount} words
            </p>
          </div>

          {/* RIGHT: SETTINGS PANEL */}
          <div className="space-y-6 border-l pl-8">
            <div>
              <Label>Excerpt</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) =>
                  handleChange("excerpt", e.target.value)
                }
                maxLength={200}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.excerpt.length}/200 characters
              </p>
            </div>

            <div>
              <Label>Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  handleChange("category", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostForm;