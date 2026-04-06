import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
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

const CATEGORIES = [
  "small business",
  "ecommerce",
  "B2B",
  "Branding & Design",
  "Software Development",
  "News",
];

export default function CreatePost() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    content: "",
    featuredImage: null,
    featuredImagePreview: null,
    category: "",
    tags: [],
    tagInput: "",
  });

  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [savingStatus, setSavingStatus] = useState("");
  const [lastSaved, setLastSaved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      const { title, content } = formDataRef.current;
      if (title || content) {
        saveDraft(true);
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, []);

  const saveDraft = async (silent = false) => {
    if (!formData.title && !formData.content) return;

    if (!silent) {
      setSavingStatus("Saving...");
    }

    try {
      const postData = new FormData();
      postData.append("title", formData.title);
      postData.append("content", formData.content);
      postData.append("subtitle", formData.subtitle);
      postData.append("category", formData.category);
      postData.append("tags", JSON.stringify(formData.tags));
      postData.append("isPublished", false);

      if (formData.featuredImage) {
        postData.append("featuredImage", formData.featuredImage);
      }

      const existingId = localStorage.getItem("currentDraftId");

      const url = existingId ? `/api/posts/${existingId}` : "/api/posts";
      const method = existingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: postData,
      });

      if (res.ok) {
        const data = await res.json();
        if (!existingId && data.post?._id) {
          localStorage.setItem("currentDraftId", data.post._id);
        }
        setLastSaved(new Date());
        if (!silent) {
          setSavingStatus("Saved");
          setTimeout(() => setSavingStatus(""), 2000);
        }
      }
    } catch (err) {
      console.error("Auto-save error:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        featuredImage: file,
        featuredImagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" && formData.tagInput.trim()) {
      e.preventDefault();
      const newTag = formData.tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 5) {
        setFormData((prev) => ({
          ...prev,
          tags: [...prev.tags, newTag],
          tagInput: "",
        }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handlePublish = async () => {
    setValidationError("");

    if (!formData.title.trim()) {
      setValidationError("Title is required");
      return;
    }
    if (!formData.content.trim()) {
      setValidationError("Content is required");
      return;
    }
    if (!formData.category) {
      setValidationError("Please select a category");
      return;
    }

    setLoading(true);

    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("content", formData.content);
    postData.append("subtitle", formData.subtitle);
    postData.append("category", formData.category);
    postData.append("tags", JSON.stringify(formData.tags));
    postData.append("isPublished", true);

    if (formData.featuredImage) {
      postData.append("featuredImage", formData.featuredImage);
    }

    try {
      const existingId = localStorage.getItem("currentDraftId");
      const url = existingId ? `/api/posts/${existingId}` : "/api/posts";
      const method = existingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: postData,
      });

      if (res.ok) {
        localStorage.removeItem("currentDraftId");
        navigate("/dashboard");
      } else {
        const errorData = await res.json();
        setValidationError(errorData.error || "Failed to publish post");
      }
    } catch (err) {
      console.error("Publish error:", err);
      setValidationError("Failed to publish post");
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content
    ? formData.content.trim().split(/\s+/).length
    : 0;

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {savingStatus || (lastSaved ? `Saved ${formatTime(lastSaved)}` : "")}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => saveDraft(false)}
            >
              Save
            </Button>

            <Button size="sm" onClick={() => setShowPublishPanel(true)}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor Area - Centered */}
      <main className="max-w-[700px] mx-auto px-6 py-16">
        {/* Title */}
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full text-4xl font-bold border-none shadow-none 
            placeholder:text-muted-foreground/50 bg-transparent resize-none
            focus:outline-none focus:ring-0 mb-4"
        />

        {/* Subtitle */}
        <input
          type="text"
          name="subtitle"
          placeholder="Subtitle (optional)"
          value={formData.subtitle}
          onChange={handleChange}
          className="w-full text-xl text-muted-foreground border-none shadow-none 
            placeholder:text-muted-foreground/40 bg-transparent resize-none
            focus:outline-none focus:ring-0 mb-8"
        />

        {/* Content */}
        <Textarea
          name="content"
          placeholder="Tell your story..."
          value={formData.content}
          onChange={handleChange}
          className="min-h-[450px] resize-none border-none shadow-none 
            text-lg leading-relaxed placeholder:text-muted-foreground/40
            focus:ring-0 focus:border-none"
        />

        {/* Word Count */}
        <div className="mt-4 text-sm text-muted-foreground">
          {wordCount} words
        </div>
      </main>

      {/* Publish Panel - Slide Over */}
      {showPublishPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPublishPanel(false)}
          />

          {/* Panel */}
          <aside className="relative w-full max-w-md bg-background border-l border-border h-full overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Publish</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPublishPanel(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Story Preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
                <div className="rounded-lg border border-border/40 p-4 space-y-3">
                  {formData.featuredImagePreview ? (
                    <img
                      src={formData.featuredImagePreview}
                      alt="Featured"
                      className="w-full h-40 object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-40 bg-muted rounded flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">
                      {formData.title || "Untitled"}
                    </h4>
                    {formData.subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {formData.featuredImagePreview && (
                  <img
                    src={formData.featuredImagePreview}
                    alt="Preview"
                    className="w-full h-40 object-cover rounded mt-2"
                  />
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (max 5)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-1 
                        bg-secondary text-secondary-foreground text-sm rounded"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formData.tags.length < 5 && (
                  <Input
                    name="tagInput"
                    placeholder="Add a tag and press Enter"
                    value={formData.tagInput}
                    onChange={handleChange}
                    onKeyDown={handleAddTag}
                  />
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
                  {validationError}
                </div>
              )}

              {/* Publish Button */}
              <Button
                className="w-full"
                size="lg"
                onClick={handlePublish}
                disabled={loading}
              >
                {loading ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}