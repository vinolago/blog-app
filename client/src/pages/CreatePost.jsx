import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreatePost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    featuredImage: null,
    category: "",
    tags: "",
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: e.target.files[0],
    }));
  };

  const handleSubmit = async (publish = false) => {
    if (!formData.title || !formData.content) {
      alert("Title and content are required.");
      return;
    }

    setLoading(true);
    setStatusMessage(publish ? "Publishing..." : "Saving draft...");

    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("content", formData.content);
    postData.append("category", formData.category);
    postData.append("tags", formData.tags);
    postData.append("isPublished", publish);

    if (formData.featuredImage) {
      postData.append("featuredImage", formData.featuredImage);
    }

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        body: postData,
      });

      if (res.ok) {
        navigate("/dashboard");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to save post");
      }
    } catch (err) {
      console.error("Error saving post:", err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  const wordCount = formData.content
    ? formData.content.trim().split(/\s+/).length
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      {/* Sticky Top Bar */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-background z-10 py-4">
        <h1 className="text-lg font-semibold text-muted-foreground">
          New Post
        </h1>

        <div className="flex items-center gap-3">
          {statusMessage && (
            <span className="text-sm text-muted-foreground">
              {statusMessage}
            </span>
          )}

          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            Save Draft
          </Button>

          <Button
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12">
        {/* LEFT: Editor */}
        <div className="col-span-2 space-y-8">
          {/* Title */}
          <Input
            name="title"
            placeholder="Post title..."
            value={formData.title}
            onChange={handleChange}
            className="text-4xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
          />

          {/* Content */}
          <Textarea
            name="content"
            placeholder="Write your story..."
            value={formData.content}
            onChange={handleChange}
            className="min-h-[450px] resize-none border-none shadow-none px-0 text-lg leading-relaxed focus-visible:ring-0"
          />

          <p className="text-sm text-muted-foreground">
            {wordCount} words
          </p>
        </div>

        {/* RIGHT: Settings Panel */}
        <div className="space-y-6 border-l pl-6">
          {/* Featured Image */}
          <div className="space-y-2">
            <Label>Featured Image</Label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />

            {formData.featuredImage && (
              <img
                src={URL.createObjectURL(formData.featuredImage)}
                alt="Preview"
                className="rounded-lg mt-2 max-h-40 object-cover"
              />
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
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

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              name="tags"
              placeholder="tech, ai, innovation"
              value={formData.tags}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}