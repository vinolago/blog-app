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
import { cn } from "@/lib/utils";

const defaultCategories = [
  "React",
  "Backend",
  "CSS",
  "Database",
  "JavaScript",
  "TypeScript",
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
  const [isPreview, setIsPreview] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingFeatured, setIsUploadingFeatured] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  // Track the created post's ID for autosave updates
  const [createdPostId, setCreatedPostId] = useState(null);
   
  const fileInputRef = useRef(null);
  const featuredImageInputRef = useRef(null);
  const editorRef = useRef(null);

  const setEditorRef = useCallback((editorInstance) => {
    if (editorInstance?.getEditor) {
      editorRef.current = editorInstance.getEditor();
    } else {
      editorRef.current = editorInstance;
    }
  }, []);

  // Image upload handler for editor
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

    setIsUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post('/posts/upload', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const imageUrl = response.data.data.url;
        if (editorRef.current) {
          editorRef.current.chain().focus().setImage({ src: imageUrl }).run();
        }
        toast({ title: "Image uploaded", description: "Image has been added to your post." });
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({ title: "Upload failed", description: "Failed to upload image. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [toast]);

  const addLink = useCallback(() => {
  if (!linkUrl || !editorRef.current) return;

  const editor = editorRef.current;

  if (!editor.state.selection.empty) {
    // Apply link to highlighted text
    editor
      .chain()
      .focus()
      .extendMarkRange("link") // IMPORTANT
      .setLink({ href: linkUrl })
      .run();
  } else {
    // Insert clickable link if nothing selected
    editor
      .chain()
      .focus()
      .insertContent(`<a href="${linkUrl}">${linkUrl}</a>`)
      .run();
  }

  setLinkUrl("");
  setIsLinkModalOpen(false);
}, [linkUrl]);

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

    setIsUploadingFeatured(true);

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
      setIsUploadingFeatured(false);
      if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
    }
  }, [toast]);

  // Delete featured image
  const deleteFeaturedImage = useCallback(() => {
    setFormData(prev => ({ ...prev, featuredImage: "" }));
    toast({ title: "Image removed", description: "Featured image has been removed." });
  }, [toast]);

  // Delete image from editor content
  const deleteEditorImage = useCallback(() => {
    if (editorRef.current && selectedImage) {
      // Find and delete the image with the selected src
      const { state } = editorRef.current;
      const { tr } = state;
      
      // Delete the selected node
      editorRef.current.chain().focus().deleteSelection().run();
      
      setSelectedImage(null);
      toast({ title: "Image removed", description: "Image has been removed from content." });
    }
  }, [selectedImage, toast]);

  // Handle image click in editor for deletion
  const handleEditorImageClick = useCallback((e) => {
    const target = e.target;
    if (target.tagName === 'IMG') {
      setSelectedImage(target.src);
    }
  }, []);

  // Medium editor setup
  const mediumEditorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && formData.content) {
      const currentContent = editorRef.current.getHTML();
      if (currentContent !== formData.content && formData.content) {
        editorRef.current.commands.setContent(formData.content);
      }
    }
  }, [formData.content]);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (user !== undefined) {
      setAuthLoading(false);
      if (!user) {
        toast({ title: "Authentication Required", description: "Please log in to create or edit posts.", variant: "destructive" });
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
    if (isEditing && slug && slug !== 'new') {
      const fetchPost = async () => {
        setLoading(true);
        try {
          const response = await api.get(`/posts/${slug}`);
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
            // Store the post ID for updates
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

  /* ---------------- AUTOSAVE ---------------- */
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      if (formData.title.trim() && formData.content.trim() && user) {
        const submitData = {
          ...formData,
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
          content: formData.content.trim(),
          isPublished: false,
          author: user?.id,
        };
        setIsAutosaving(true);
        // Use PUT with createdPostId if available, otherwise skip autosave for new posts
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

  /* ---------------- KEYBOARD SHORTCUTS ---------------- */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // Trigger autosave
        if (formData.title.trim() && formData.content.trim() && user) {
          const submitData = {
            ...formData,
            title: formData.title.trim(),
            excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
            content: formData.content.trim(),
            isPublished: false,
            author: user?.id,
          };
          setIsAutosaving(true);
          // Use PUT with createdPostId if available, otherwise skip for new posts
          const savePromise = createdPostId
            ? api.put(`/posts/${createdPostId}`, submitData)
            : isEditing
              ? api.put(`/posts/${slug}`, submitData)
              : null;

          if (savePromise) {
            savePromise
              .then(() => { setLastSaved(new Date()); toast({ title: "Draft saved" }); })
              .catch(console.error)
              .finally(() => setIsAutosaving(false));
          } else {
            setIsAutosaving(false);
            toast({ title: "Please save the post first using the button" });
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, user, isEditing, slug, createdPostId, toast]);

  /* ---------------- HELPERS ---------------- */
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag)) {
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

  const validate = () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      toast({ title: "Validation Error", description: "Please fill in title, content, and category.", variant: "destructive" });
      return false;
    }
    if (formData.title.length > 100) {
      toast({ title: "Validation Error", description: "Title cannot exceed 100 characters.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const submitPost = async (publish) => {
    if (!validate()) return;
    if (loading) return; // Prevent double submission
    setLoading(true);
    // Disable autosave during submit to prevent duplicates
    setIsAutosaving(false);
    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim() || formData.content.replace(/<[^>]*>/g, "").substring(0, 200),
        content: formData.content.trim(),
        isPublished: publish,
        author: user?.id,
      };
      
      let response;
      if (isEditing) {
        response = await api.put(`/posts/${slug}`, submitData);
      } else if (createdPostId) {
        // If we already have a created post, update it instead of creating a new one
        response = await api.put(`/posts/${createdPostId}`, submitData);
      } else {
        // Create new post
        response = await api.post("/posts", submitData);
        // Store the created post's ID for future updates
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

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Top Action Bar - dev.to style */}
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
          <a href="https://swypstudio.co.ke" className="hover:opacity-80 transition-opacity">
                          <img
                            src={swyp_p_logo}
                            alt="Swyp Logo"
                            className="h-8 w-24 sm:h-10 sm:w-32"
                          />
          </a>
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
            <Link to="/posts"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link>
          </Button>
          </div>
          <div className="flex items-center gap-3">
            {isAutosaving && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />Saving...
              </span>
            )}
            {lastSaved && !isAutosaving && <span className="text-xs text-gray-400">Saved</span>}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPreview(!isPreview)}
              className="rounded-full bg-gray-100 border-none text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              {isPreview ? (
                <><Edit3 className="mr-1 h-3 w-3" />Edit</>
              ) : (
                <><Eye className="mr-1 h-3 w-3" />Preview</>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => submitPost(false)} 
              disabled={loading}
              className="rounded-full bg-gray-100 border-none text-gray-600 hover:bg-gray-200 cursor-pointer"
            >
              Save draft
            </Button>
            <Button 
              onClick={() => submitPost(true)} 
              disabled={loading}
              className="rounded-full bg-[#2a5cff] hover:bg-[#2a5cff]/80 cursor-pointer text-white"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Publishing..." : isEditing ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Huge Title Input - dev.to style */}
        <input
          type="text"
          placeholder="New post title here..."
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          maxLength={100}
          className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder-gray-400 py-2 text-gray-900"
        />

        {/* Tags Input - dev.to style */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {formData.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
            </span>
          ))}
          <input 
            type="text" 
            value={tagInput} 
            onChange={(e) => setTagInput(e.target.value)} 
            onKeyDown={addTag} 
            placeholder="Add tags..." 
            className="bg-transparent border-none outline-none text-xs text-gray-500 placeholder-gray-400 min-w-[100px]"
          />
        </div>

        <div className="mt-8">
          {isPreview ? (
            <div className="bg-white p-8 rounded-lg shadow-sm min-h-[400px]">
              <h1 className="text-4xl font-bold mb-6 text-gray-900">{formData.title || 'Untitled'}</h1>
              <article 
                className="content-body"
                dangerouslySetInnerHTML={{ __html: formData.content }} 
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {/* Medium-style Editor - no toolbar, uses BubbleMenu */}
              <div className="p-6">
                <MediumEditor
                  ref={mediumEditorRef}
                  content={formData.content}
                  onChange={(content) => handleChange("content", content)}
                  placeholder="Tell your story..."
                />
              </div>
            </div>
          )}

          {/* Word count */}
          <div className="mt-4 text-sm text-gray-400">
            {wordCount} words · {readingTime} min read
          </div>
        </div>

        {/* Sidebar - dev.to style */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Post Settings</h3>
            <div className="space-y-4">
              <div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </Label>

                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleChange("category", value)}
                  >
                    <SelectTrigger
                      className="
                        h-11
                        w-full
                        rounded-lg
                        border border-gray-300/70
                        bg-white/70
                        backdrop-blur-sm
                        shadow-sm
                        transition-all duration-200
                        hover:border-gray-400
                        hover:shadow-md
                        focus:ring-2 focus:ring-gray-500/40
                        focus:border-gray-500
                        data-[state=open]:ring-2 
                        data-[state=open]:ring-gray-500/40
                        dark:bg-gray-900/60
                        dark:border-gray-700
                        dark:hover:border-gray-600
                      "
                    >
                      <SelectValue
                        placeholder="Select a category"
                        className="text-gray-500"
                      />
                    </SelectTrigger>

                    <SelectContent
                      className="
                        rounded-lg
                        border border-gray-200
                        bg-white/95
                        backdrop-blur-md
                        shadow-xl
                        dark:bg-gray-900
                        dark:border-gray-700
                      "
                    >
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat._id}
                          value={cat._id}
                          className="
                            cursor-pointer
                            rounded-md
                            px-3 py-2
                            text-sm
                            transition-colors
                            hover:bg-blue-50
                            focus:bg-blue-50
                            dark:hover:bg-gray-800
                            dark:focus:bg-gray-800
                          "
                        >
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
</div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Excerpt</Label>
                <Textarea 
                  value={formData.excerpt} 
                  onChange={(e) => handleChange("excerpt", e.target.value)} 
                  maxLength={200} 
                  rows={3} 
                  placeholder="Short description for this post..." 
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">{formData.excerpt.length}/200 characters</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Cover Image</h3>
            <div className="space-y-3">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => featuredImageInputRef.current?.click()} 
                disabled={isUploadingFeatured} 
                className="w-full cursor-pointer hover:bg-gray-200"
              >
                {isUploadingFeatured ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ImageIcon className="h-4 w-4 mr-2" />
                )}
                Upload Image
              </Button>
              <input 
                ref={featuredImageInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleFeaturedImageUpload} 
                className="hidden" 
              />
              <Input 
                value={formData.featuredImage} 
                onChange={(e) => handleChange("featuredImage", e.target.value)} 
                placeholder="Or enter image URL..." 
              />
              {formData.featuredImage && (
                <div className="mt-2 relative group">
                  <img 
                    src={formData.featuredImage.startsWith('http') ? formData.featuredImage : `https://blog-app-0tyx.onrender.com/uploads/${formData.featuredImage}`} 
                    alt="Featured" 
                    className="w-full h-32 object-cover rounded" 
                  />
                  <button
                    type="button"
                    onClick={deleteFeaturedImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Delete image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostForm;
