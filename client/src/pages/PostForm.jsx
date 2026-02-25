import { useState, useEffect, useContext, useMemo, useCallback, useRef } from "react";
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
import { ArrowLeft, Save, Eye, Edit3, X, Clock, Loader2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/context/AuthContext";
import api from "@/api/axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";

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
  
  const fileInputRef = useRef(null);
  const featuredImageInputRef = useRef(null);
  const editorRef = useRef(null);

  const setEditorRef = useCallback((editorInstance) => {
    editorRef.current = editorInstance;
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

  // Featured image upload handler
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

  // TipTap editor setup
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Write your story..." }),
      Image.configure({ inline: true, allowBase64: true }),
    ],
    content: formData.content,
    onUpdate: ({ editor }) => {
      setFormData(prev => ({ ...prev, content: editor.getHTML() }));
    },
    onCreate: ({ editor }) => setEditorRef(editor),
    editorProps: {
      attributes: { class: "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[300px] p-4" },
    },
  });

  useEffect(() => {
    if (editor && formData.content && editor.getHTML() !== formData.content) {
      editor.commands.setContent(formData.content);
    }
  }, [editor, formData.content]);

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
            if (editor) editor.commands.setContent(post.content || "");
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
  }, [slug, isEditing, navigate, toast, editor]);

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
        (isEditing ? api.put(`/posts/${slug}`, submitData) : api.post("/posts", submitData))
          .then(() => setLastSaved(new Date()))
          .catch(console.error)
          .finally(() => setIsAutosaving(false));
      }
    }, 20000);
    return () => clearInterval(autosaveInterval);
  }, [formData, user, isEditing, slug]);

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
          (isEditing ? api.put(`/posts/${slug}`, submitData) : api.post("/posts", submitData))
            .then(() => { setLastSaved(new Date()); toast({ title: "Draft saved" }); })
            .catch(console.error)
            .finally(() => setIsAutosaving(false));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [formData, user, isEditing, slug, toast]);

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
      const response = isEditing ? await api.put(`/posts/${slug}`, submitData) : await api.post("/posts", submitData);
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Button variant="ghost" asChild><Link to="/posts"><ArrowLeft className="mr-2 h-4 w-4" />Back</Link></Button>
          <div className="flex items-center gap-4">
            {isAutosaving && <span className="text-sm text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving...</span>}
            {lastSaved && !isAutosaving && <span className="text-xs text-muted-foreground">Last saved: {lastSaved.toLocaleTimeString()}</span>}
            <Button variant="outline" size="sm" onClick={() => setIsPreview(!isPreview)}>
              {isPreview ? <><Edit3 className="mr-2 h-4 w-4" />Edit</> : <><Eye className="mr-2 h-4 w-4" />Preview</>}
            </Button>
            <Button variant="outline" onClick={() => submitPost(false)} disabled={loading}>Save Draft</Button>
            <Button onClick={() => submitPost(true)} disabled={loading}><Save className="mr-2 h-4 w-4" />{loading ? "Saving..." : isEditing ? "Update & Publish" : "Publish"}</Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-3 gap-12">
          <div className="col-span-2 space-y-6">
            <Input placeholder="Post title..." value={formData.title} onChange={(e) => handleChange("title", e.target.value)} maxLength={100} className="text-4xl font-bold border-none shadow-none px-0 focus-visible:ring-0" />

            {isPreview ? (
              <div className="prose max-w-none min-h-[300px] p-4 border rounded-lg">
                <h1 className="text-3xl font-bold mb-4">{formData.title}</h1>
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            ) : (
              <div className="border rounded-lg min-h-[350px]">
                <div className="flex flex-wrap gap-2 p-2 border-b bg-muted/20">
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive("bold") ? "bg-muted" : ""}><span className="font-bold">B</span></Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive("italic") ? "bg-muted" : ""}><span className="italic">I</span></Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive("strike") ? "bg-muted" : ""}><span className="line-through">S</span></Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive("heading", { level: 1 }) ? "bg-muted" : ""}>H1</Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive("heading", { level: 2 }) ? "bg-muted" : ""}>H2</Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={editor?.isActive("heading", { level: 3 }) ? "bg-muted" : ""}>H3</Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive("bulletList") ? "bg-muted" : ""}>• List</Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive("orderedList") ? "bg-muted" : ""}>1. List</Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={editor?.isActive("blockquote") ? "bg-muted" : ""}>Quote</Button>
                  <Button variant="outline" size="sm" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} className={editor?.isActive("codeBlock") ? "bg-muted" : ""}>Code</Button>
                  <div className="w-px h-6 bg-border mx-1" />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="Upload image">
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                <EditorContent editor={editor} />
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{readingTime} min read</span>
            </div>
          </div>

          <div className="space-y-6 border-l pl-8">
            <div>
              <Label>Excerpt</Label>
              <Textarea value={formData.excerpt} onChange={(e) => handleChange("excerpt", e.target.value)} maxLength={200} rows={4} placeholder="Short description..." />
              <p className="text-xs text-muted-foreground mt-1">{formData.excerpt.length}/200 characters</p>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (<SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                    {tag}<button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Add tags (press Enter)" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Featured Image</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => featuredImageInputRef.current?.click()} disabled={isUploadingFeatured}>
                  {isUploadingFeatured ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}Upload
                </Button>
              </div>
              <input ref={featuredImageInputRef} type="file" accept="image/*" onChange={handleFeaturedImageUpload} className="hidden" />
              <Input value={formData.featuredImage} onChange={(e) => handleChange("featuredImage", e.target.value)} placeholder="Or enter image URL..." />
              {formData.featuredImage && (
                <div className="mt-2 relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img src={formData.featuredImage} alt="Featured" className="w-full h-full object-cover" onError={(e) => e.target.style.display = "none"} />
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
