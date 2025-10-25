import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, User, Clock, Edit } from "lucide-react";

// Mock data - will be replaced with API calls
const mockPost = {
  id: "1",
  title: "Getting Started with React and TypeScript",
  content: `
# Introduction

React and TypeScript are a powerful combination for building modern web applications. TypeScript adds static typing to JavaScript, which helps catch errors early and provides better tooling support.

## Why TypeScript?

TypeScript offers several advantages:

- **Type Safety**: Catch errors at compile time rather than runtime
- **Better IDE Support**: Improved autocomplete and refactoring tools
- **Self-documenting Code**: Types serve as inline documentation
- **Scalability**: Easier to maintain large codebases

## Setting Up Your Project

To create a new React project with TypeScript, you can use Vite:

\`\`\`bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
npm run dev
\`\`\`

## Creating Your First Component

Here's a simple example of a TypeScript React component:

\`\`\`tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
\`\`\`

## Best Practices

1. **Use Interfaces**: Define clear interfaces for your component props
2. **Avoid Any**: Try to use specific types instead of \`any\`
3. **Leverage Generics**: Use generic types for reusable components
4. **Type Your Hooks**: Always type useState and useEffect properly

## Conclusion

React and TypeScript together provide a robust foundation for building scalable applications. Start small, and gradually adopt more TypeScript features as you become comfortable with the basics.
  `,
  author: "Sarah Chen",
  date: "2025-10-20",
  category: "React",
  readTime: "5 min read"
};

const PostDetail = () => {
  const { id } = useParams();

  // In a real app, fetch post by id
  const post = mockPost;

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
              <Link to={`/posts/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Post
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <article className="content-container">
          {/* Post Header */}
          <div className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight">{post.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="font-medium">{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(post.date).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{post.readTime}</span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Post Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.content.split("\n\n").map((paragraph, index) => {
              if (paragraph.startsWith("#")) {
                const level = (paragraph.match(/^#+/) || ["#"])[0].length;
                const text = paragraph.replace(/^#+\s/, "");
                const HeadingTag = `h${level}`;
                return (
                  <HeadingTag key={index} className="mb-4 mt-8 font-bold">
                    {text}
                  </HeadingTag>
                );
              } else if (paragraph.startsWith("```")) {
                const code = paragraph.replace(/```\w*\n?/, "").replace(/```$/, "");
                return (
                  <pre key={index} className="my-6 overflow-x-auto rounded-lg bg-muted p-4">
                    <code>{code}</code>
                  </pre>
                );
              } else if (paragraph.startsWith("- ")) {
                const items = paragraph.split("\n");
                return (
                  <ul key={index} className="my-4 ml-6 list-disc space-y-2">
                    {items.map((item, i) => (
                      <li key={i}>
                        {item
                          .replace(/^-\s\*\*([^*]+)\*\*:\s/, "<strong>$1</strong>: ")
                          .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")}
                      </li>
                    ))}
                  </ul>
                );
              } else if (paragraph.match(/^\d+\./)) {
                const items = paragraph.split("\n");
                return (
                  <ol key={index} className="my-4 ml-6 list-decimal space-y-2">
                    {items.map((item, i) => (
                      <li key={i}>
                        {item.replace(/^\d+\.\s\*\*([^*]+)\*\*:\s/, "<strong>$1</strong>: ")}
                      </li>
                    ))}
                  </ol>
                );
              } else {
                return (
                  <p key={index} className="my-4 leading-relaxed text-foreground">
                    {paragraph}
                  </p>
                );
              }
            })}
          </div>
        </article>
      </main>
    </div>
  );
};

export default PostDetail;
