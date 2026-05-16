import { useState, useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Clock, Edit, Loader2, List } from "lucide-react";
import api from "@/api/axios";

const PostDetail = () => {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeHeading, setActiveHeading] = useState("");

  // Extract headings from content for table of contents and add IDs
  const { tocHeadings, processedContent } = useMemo(() => {
    if (!post?.content) return { tocHeadings: [], processedContent: post?.content || '' };
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.content, 'text/html');
    const headingElements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    const headingsArray = [];
    headingElements.forEach((el, index) => {
      const id = `heading-${index}`;
      el.id = id;
      headingsArray.push({
        id,
        text: el.textContent,
        level: parseInt(el.tagName.charAt(1))
      });
    });
    
    return {
      tocHeadings: headingsArray,
      processedContent: doc.body.innerHTML
    };
  }, [post?.content]);

  // Use headings for rendering - merge with headings from TOC
  const headings = tocHeadings;

  // Intersection Observer for active heading detection
  useEffect(() => {
    if (!headings.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    // Wait for content to render, then observe
    const timer = setTimeout(() => {
      const headingElements = document.querySelectorAll('[id^="heading-"]');
      headingElements.forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings]);

  // Scroll to heading
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.pushState(null, '', `#${id}`);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/posts/${slug}`);
        setPost(response.data.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(err.response?.data?.error || "Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Calculate reading time
  const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, ""); // Strip HTML tags
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button asChild>
          <Link to="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Post not found</p>
        <Button asChild>
          <Link to="/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link to="/posts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Posts
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/posts/${post.slug}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Post
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex gap-8">
          {/* Table of Contents - Desktop */}
          {headings.length > 0 && (
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <List className="h-4 w-4" />
                  Table of Contents
                </div>
                <nav className="space-y-1">
                  {headings.map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`block w-full truncate rounded px-2 py-1 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                        activeHeading === heading.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}
                      style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          <article className="flex-1">
            {/* Mobile Table of Contents */}
            {headings.length > 0 && (
              <details className="mb-6 lg:hidden">
                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                  <List className="h-4 w-4" />
                  Table of Contents
                </summary>
                <nav className="mt-2 space-y-1 rounded-lg bg-muted/30 p-3">
                  {headings.map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToHeading(heading.id)}
                      className={`block w-full truncate rounded px-2 py-1 text-left text-sm transition-colors hover:bg-accent/50 ${
                        activeHeading === heading.id
                          ? 'font-medium text-primary'
                          : 'text-muted-foreground'
                      }`}
                      style={{ paddingLeft: `${(heading.level - 1) * 12 + 8}px` }}
                    >
                      {heading.text}
                    </button>
                  ))}
                </nav>
              </details>
            )}

            {/* Post Header */}
            <div className="mb-8">
              {post.category && (
                <Badge className="mb-4">{post.category.name}</Badge>
              )}
              <h1 className="mb-6 text-5xl font-bold tracking-tight">{post.title}</h1>

              <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{post.author?.name || "Unknown Author"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{calculateReadingTime(post.content)}</span>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {post.featuredImage && post.featuredImage !== 'default-post.jpg' && (
              <div className="mb-8">
                <img 
                  src={post.featuredImage.startsWith('http') ? post.featuredImage : `/uploads/${post.featuredImage}`} 
                  alt={post.title}
                  className="w-full h-auto rounded-lg object-cover max-h-[500px]"
                />
              </div>
            )}

            <Separator className="my-8" />

            {/* Post Content - Render HTML from TipTap */}
            <div 
              className="content-body"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />
            
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
};

export default PostDetail;
