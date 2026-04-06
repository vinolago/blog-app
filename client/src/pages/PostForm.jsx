import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import swyp_p_logo from "../assets/swyp_p_logo.svg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Edit3, X, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import api from "@/api/axios";
import MediumEditor from "@/components/ui/MediumEditor";

const CATEGORIES = [
  "small business",
  "ecommerce",
  "B2B",
  "Branding & Design",
  "Software Development",
  "News",
];

const calculateReadingTime = (text) => {
  if (!text) return 0;
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

const PostForm = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useContext(AuthContext);
  const isEditing = Boolean(slug) && slug !== 'new';

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: "",
    featuredImage: "",
    tags: [],
    isPublished: false,
  });

  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [createdPostId, setCreatedPostId] = useState(null);
    
  const fileInputRef = useRef(null);
  const featuredImageInputRef = useRef(null);
  const mediumEditorRef = useRef(null);

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB.", variant: "destructive" });
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/posts/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const imageUrl = response.data.data.url;
        if (mediumEditorRef.current?.getEditor) {
          mediumEditorRef.current.getEditor().chain().focus().setImage({ src: imageUrl }).run();
        }
        toast({ title: "Image uploaded", description: "Image has been added to your post." });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [toast]);

  const handleFeaturedImageUpload = useCallback(async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file type", description: "Please upload an image file.", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Image must be less than 5MB.", variant: "destructive" });
      return;
    }

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/posts/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setFormData(prev => ({ ...prev, featuredImage: response.data.data.url }));
        toast({ title: "Image uploaded", description: "Featured image set." });
      }
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload image.", variant: "destructive" });
    } finally {
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
    }
  }, [toast]);

  const deleteFeaturedImage = useCallback(() => {
    setFormData(prev => ({ ...prev, featuredImage: "" }));
    toast({ title: "Image removed", description: "Featured image has been removed." });
  }, [toast]);

  useEffect(() => {
    if (user !== undefined) {
      setAuthLoading(false);
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to create or edit posts.", variant: "destructive" });
        navigate("/login");
      }
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    if (isEditing && slug && slug !== 'new') {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/posts/${slug}`);
          if (response.data.success) {
            const post = response.data.data;
            setFormData({
              title: post.title || "",
              content: post.content || "",
              excerpt: post.excerpt || "",
              category: post.category?.name || "",
              featuredImage: post.featuredImage || "",
              tags: post.tags || [],
              isPublished: post.isPublished || false,
            });
            setCreatedPostId(post._id);
          }
        } catch {
          toast({ title: "Error loading post", description: "Failed to load post data.", variant: "destructive" });
          navigate("/posts");
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [slug, isEditing, navigate, toast]);

  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (formData.title.trim() && formData.content.trim() && user) {
        const submitData = {
          ...formData,
          excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
          isPublished: false,
          author: user?.id,
        };
        setIsAutosaving(true);
        const savePromise = createdPostId 
          ? api.put(`/posts/${createdPostId}`, submitData)
          : isEditing 
            ? api.put(`/posts/${slug}`, submitData)
            : null;
        
        if (savePromise) {
          savePromise
            .then(() => setLastSaved(new Date()))
            .catch(console.error)
            .finally(() => setIsAutosaving(false));
        } else {
          setIsAutosaving(false);
        }
      }
    }, 20000);
    return () => clearInterval(autosaveInterval);
  }, [formData, user, isEditing, slug, createdPostId]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag) && formData.tags.length < 5) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const wordCount = useMemo(() => {
    if (!formData.content) return 0;
    const text = formData.content.replace(/<[^>]*>/g, "");
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [formData.content]);

  const readingTime = useMemo(() => calculateReadingTime(formData.content.replace(/<[^>]*>/g, "")), [formData.content]);

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const validate = () => {
    setValidationError("");
    
    if (!formData.title.trim()) {
      setValidationError("Title is required");
      return false;
    }
    if (!formData.content.trim() || formData.content === "<p></p>") {
      setValidationError("Content is required");
      return false;
    }
    if (!formData.category) {
      setValidationError("Please select a category");
      return false;
    }
    if (formData.title.length > 100) {
      setValidationError("Title cannot exceed 100 characters");
      return false;
    }
    return true;
  };

  const submitPost = async (publish) => {
    if (!validate()) return;
    if (loading) return;
    setLoading(true);
    setIsAutosaving(false);
    
    try {
      const submitData = {
        ...formData,
        excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
        isPublished: publish,
        author: user?.id,
      };
      
      let response;
      if (isEditing) {
        response = await api.put(`/posts/${slug}`, submitData);
      } else if (createdPostId) {
        response = await api.put(`/posts/${createdPostId}`, submitData);
      } else {
        response = await api.post("/posts", submitData);
        if (response.data.success && response.data.data._id) {
          setCreatedPostId(response.data.data._id);
        }
      }
      
      if (response.data.success) {
        toast({ title: publish ? (isEditing ? "Post Updated" : "Post Published") : "Draft Saved" });
        navigate("/posts");
      }
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.error || "Something went wrong.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim() && !formData.content.trim()) return;
    
    setIsAutosaving(true);
    const submitData = {
      ...formData,
      excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
      isPublished: false,
      author: user?.id,
    };
    
    try {
      let response;
      if (isEditing) {
        response = await api.put(`/posts/${slug}`, submitData);
      } else if (createdPostId) {
        response = await api.put(`/posts/${createdPostId}`, submitData);
      } else {
        response = await api.post("/posts", submitData);
        if (response.data.success && response.data.data._id) {
          setCreatedPostId(response.data.data._id);
        }
      }
      
      if (response.data.success) {
        setLastSaved(new Date());
        toast({ title: "Draft saved" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save draft", variant: "destructive" });
    } finally {
      setIsAutosaving(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar - Medium Style */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border/40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="https://swypstudio.co.ke" className="hover:opacity-80 transition-opacity">
              <img
                src={swyp_p_logo}
                alt="Swyp Logo"
                className="h-8 w-24"
              />
            </a>
            <Link
              to="/posts"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isAutosaving ? "Saving..." : (lastSaved ? `Saved ${formatTime(lastSaved)}` : "")}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isAutosaving}
            >
              Save
            </Button>

            <Button size="sm" onClick={() => setShowPublishPanel(true)}>
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Editor Area - Centered, Medium Style */}
      <main className="max-w-[700px] mx-auto px-6 py-16">
        {/* Title */}
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          maxLength={100}
          className="w-full text-4xl font-bold border-none shadow-none 
            placeholder:text-muted-foreground/50 bg-transparent resize-none
            focus:outline-none focus:ring-0 mb-4"
        />

        {/* Editor / Preview */}
        <div className="mt-8">
          {isPreview ? (
            <div className="rounded-lg border p-8 min-h-[400px]">
              <h1 className="text-4xl font-bold mb-6">{formData.title || 'Untitled'}</h1>
              <article 
                className="content-body"
                dangerouslySetInnerHTML={{ __html: formData.content }} 
              />
            </div>
          ) : (
            <div className="rounded-lg">
              <MediumEditor
                ref={mediumEditorRef}
                content={formData.content}
                onChange={(content) => handleChange("content", content)}
                placeholder="Tell your story..."
              />
            </div>
          )}

          {/* Word count */}
          <div className="mt-4 text-sm text-muted-foreground">
            {wordCount} words · {readingTime} min read
          </div>
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
                  {formData.featuredImage ? (
                    <img
                      src={formData.featuredImage.startsWith('http') ? formData.featuredImage : `https://blog-app-0tyx.onrender.com/uploads/${formData.featuredImage}`}
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
                    {formData.excerpt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formData.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured Image */}
              <div className="space-y-2">
                <Label>Featured Image</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => featuredImageInputRef.current?.click()} 
                  className="w-full"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                <input 
                  ref={featuredImageInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFeaturedImageUpload} 
                  className="hidden" 
                />
                {formData.featuredImage && (
                  <div className="mt-2 relative group">
                    <img 
                      src={formData.featuredImage.startsWith('http') ? formData.featuredImage : `https://blog-app-0tyx.onrender.com/uploads/${formData.featuredImage}`}
                      alt="Featured" 
                      className="w-full h-40 object-cover rounded" 
                    />
                    <button
                      type="button"
                      onClick={deleteFeaturedImage}
                      className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formData.tags.length < 5 && (
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder="Add a tag and press Enter"
                  />
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange("category", value)}
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

              {/* Excerpt */}
              <div className="space-y-2">
                <Label>Excerpt</Label>
                <Textarea 
                  value={formData.excerpt} 
                  onChange={(e) => handleChange("excerpt", e.target.value)} 
                  maxLength={200} 
                  rows={3} 
                  placeholder="Short description for preview..."
                />
                <p className="text-xs text-muted-foreground text-right">{formData.excerpt.length}/200</p>
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
                onClick={() => submitPost(true)}
                disabled={loading}
              >
                {loading ? "Publishing..." : (isEditing ? "Update" : "Publish")}
              </Button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default PostForm;