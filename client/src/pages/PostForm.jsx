import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import swyp_p_logo from "../assets/swyp_p_logo.svg";
import { ArrowLeft, Save, Eye, Edit3, X, Loader2, Image as ImageIcon, Upload, Clock, Calendar } from "lucide-react";
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
      toast.error({ title: "Invalid file type", description: "Please upload an image file." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "File too large", description: "Image must be less than 5MB." });
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
        toast.success({ title: "Image uploaded", description: "Image has been added to your post." });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error({ title: "Upload failed", description: "Failed to upload image. Please try again." });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [toast]);

  const handleFeaturedImageUpload = useCallback(async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error({ title: "Invalid file type", description: "Please upload an image file." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error({ title: "File too large", description: "Image must be less than 5MB." });
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
        toast.success({ title: "Image uploaded", description: "Featured image set." });
      }
    } catch (error) {
      toast.error({ title: "Upload failed", description: "Failed to upload image." });
    } finally {
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
    }
  }, [toast]);

  const deleteFeaturedImage = useCallback(() => {
    setFormData(prev => ({ ...prev, featuredImage: "" }));
    toast.info({ title: "Image removed", description: "Featured image has been removed." });
  }, [toast]);

  useEffect(() => {
    if (user !== undefined) {
      setAuthLoading(false);
      if (!user) {
        toast.error({ title: "Authentication Required", description: "Please log in to create or edit posts." });
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
          toast.error({ title: "Error loading post", description: "Failed to load post data." });
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
        toast.success({ title: publish ? (isEditing ? "Post Updated" : "Post Published") : "Draft Saved" });
        navigate("/posts");
      }
    } catch (error) {
      console.error('Submit post error:', error);
      try {
        const errorMessage = error.response?.data?.error || error.message || "Something went wrong.";
        toast.error({ title: "Error", description: errorMessage });
      } catch (toastErr) {
        console.error('Toast error:', toastErr);
      }
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
        toast.success({ title: "Draft saved" });
      }
    } catch (error) {
      toast.error({ title: "Error", description: "Failed to save draft" });
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

            <Button size="sm" 
            onClick={() => setShowPublishPanel(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
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
            focus:outline-none focus:ring-0 mb-4 break-words overflow-wrap-anywhere"
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

      {showPublishPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop - dimmed with blur */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px] animate-overlay-fade"
            onClick={() => setShowPublishPanel(false)}
          />

          {/* Publish Panel - centered modal */}
          <div className="relative bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] w-[520px] max-h-[90vh] overflow-hidden animate-panel-appear">
            {/* Header */}
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-semibold text-[#1A1A1A]">Ready to publish?</h2>
                <button 
                  onClick={() => setShowPublishPanel(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#6B6B6B] hover:bg-[#F7F7F7] transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-8 pb-8 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Story Preview Section */}
              <div className="bg-[#FAFAFA] rounded-xl p-4">
                <div className="flex gap-4">
                  {/* Text Preview */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[18px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
                      {formData.title || "Untitled post"}
                    </h3>
                    <p className="text-[14px] text-[#6B6B6B] mt-1.5 line-clamp-2">
                      {formData.excerpt || formData.content.replace(/<[^>]*>/g, "").substring(0, 100) || "No description yet..."}
                    </p>
                  </div>
                  
                  {/* Featured Image Thumbnail */}
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-[#F2F2F2] relative group">
                    {formData.featuredImage ? (
                      <>
                        <img 
                          src={formData.featuredImage.startsWith('http') ? formData.featuredImage : `https://blog-app-0tyx.onrender.com/uploads/${formData.featuredImage}`}
                          alt="Featured" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">Edit</span>
                        </div>
                      </>
                    ) : (
                      <button 
                        onClick={() => featuredImageInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
                      >
                        <Upload className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured Image Upload (if no image) */}
              {!formData.featuredImage && (
                <div>
                  <input 
                    ref={featuredImageInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFeaturedImageUpload} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => featuredImageInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#E0E0E0] rounded-xl py-5 flex flex-col items-center justify-center text-[#6B6B6B] hover:border-[#BDBDBD] hover:bg-[#FAFAFA] transition-all duration-200 group"
                  >
                    <Upload className="w-6 h-6 mb-2 text-[#BDBDBD] group-hover:text-[#6B6B6B] transition-colors" />
                    <span className="text-[14px]">Add a high-quality featured image</span>
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="h-px bg-[rgba(0,0,0,0.06)]" />

              {/* Tags Input Section */}
              <div>
                <Label className="text-[13px] text-[#6B6B6B] block mb-3">Add tags (up to 5)</Label>
                <div className="flex flex-wrap items-center gap-2 min-h-[40px] p-2 bg-[#FAFAFA] rounded-lg border border-transparent focus-within:border-[#E0E0E0] transition-all duration-200">
                  {formData.tags.map((tag, index) => (
                    <span 
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F2F2F2] text-[#1A1A1A] text-[13px] rounded-full animate-tag-appear"
                    >
                      {tag}
                      <button 
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {formData.tags.length < 5 && (
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                      placeholder={formData.tags.length === 0 ? "Press Enter to add tags..." : ""}
                      className="flex-1 min-w-[100px] border-none bg-transparent text-[14px] text-[#1A1A1A] placeholder:text-[#BDBDBD] focus:outline-none focus:ring-0 p-1"
                    />
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(0,0,0,0.06)]" />

              {/* Category / Topic Selector */}
              <div>
                <Label className="text-[13px] text-[#6B6B6B] block mb-3">Topic</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleChange("category", formData.category === cat ? "" : cat)}
                      className={`px-4 py-2 rounded-full text-[14px] font-medium transition-all duration-200 cursor-pointer ${
                        formData.category === cat 
                          ? "bg-[#1A1A1A] text-white" 
                          : "bg-[#F2F2F2] text-[#6B6B6B] hover:bg-[#E8E8E8]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-[rgba(0,0,0,0.06)]" />

              {/* Validation Error */}
              {validationError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {validationError}
                </div>
              )}

              {/* Publish Button (Primary CTA) */}
              <Button
                className="w-full h-12 text-[15px] font-medium rounded-full cursor-pointer bg-[#2a5cff] hover:bg-[#2a5cff]/90 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                size="lg"
                onClick={() => submitPost(true)}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Publishing...
                  </span>
                ) : isEditing ? "Publish changes" : "Publish now"}
              </Button>

              {/* Secondary Actions */}
              <div className="flex items-center justify-center gap-6">
                <button 
                  className="text-[14px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => {
                    handleSaveDraft();
                    setShowPublishPanel(false);
                  }}
                  disabled={isAutosaving}
                >
                  <Clock className="w-4 h-4" />
                  Save as draft
                </button>
                <button 
                  className="text-[14px] text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors cursor-pointer flex items-center gap-1.5"
                  onClick={() => submitPost(false)}
                  disabled={loading}
                >
                  <Calendar className="w-4 h-4" />
                  Schedule for later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes overlay-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes panel-appear {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes tag-appear {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-overlay-fade { animation: overlay-fade 0.2s ease-out forwards; }
        .animate-panel-appear { animation: panel-appear 0.25s ease-out forwards; }
        .animate-tag-appear { animation: tag-appear 0.15s ease-out forwards; }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default PostForm;