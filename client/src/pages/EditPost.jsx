import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    isPublished: false,
    featuredImage: null,
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPostData();
    fetchCategories();
  }, []);

  // Fetch post details to prefill the form
  const fetchPostData = async () => {
    try {
      const res = await fetch(`/api/posts/${id}`);
      const data = await res.json();
      setFormData({
        title: data.title || "",
        content: data.content || "",
        category: data.category?._id || "",
        tags: data.tags?.join(", ") || "",
        isPublished: data.isPublished || false,
        featuredImage: null,
      });
    } catch (err) {
      console.error("Error fetching post:", err);
    }
  };

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    setFormData((prev) => ({ ...prev, featuredImage: e.target.files[0] }));
  };

  // Handle form submission (update post)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const updatedData = new FormData();
    updatedData.append("title", formData.title);
    updatedData.append("content", formData.content);
    updatedData.append("category", formData.category);
    updatedData.append("tags", formData.tags);
    updatedData.append("isPublished", formData.isPublished);
    if (formData.featuredImage) {
      updatedData.append("featuredImage", formData.featuredImage);
    }

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        body: updatedData,
      });

      if (res.ok) {
        navigate("/dashboard");
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update post");
      }
    } catch (err) {
      console.error("Error updating post:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="border border-border shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Edit Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                name="content"
                rows="8"
                value={formData.content}
                onChange={handleChange}
                required
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label htmlFor="featuredImage">Update Featured Image (optional)</Label>
              <Input
                id="featuredImage"
                name="featuredImage"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
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

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
              />
            </div>

            {/* Publish Switch */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isPublished">Published?</Label>
              <Switch
                id="isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPublished: checked })
                }
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
