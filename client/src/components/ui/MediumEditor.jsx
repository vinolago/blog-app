import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import sanitizeHtml from "sanitize-html";
import { 
  Bold, Italic, Strikethrough,
  List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon, CheckSquare, Minus, X, Heading, Underline as UnderlineIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const cleanWordHTML = (html) => {
  if (!html) return '';
  
  let cleaned = sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'del', 'mark',
      'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4',
      'blockquote', 'pre', 'code',
      'a', 'img',
      'hr',
      'span',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel'],
      'img': ['src', 'alt', 'width', 'height', 'style'],
      'span': ['style'],
      'p': ['style'],
      'h1': ['style'],
      'h2': ['style'],
      'h3': ['style'],
      'h4': ['style'],
    },
    transformTags: {
      'b': 'strong',
      'i': 'em',
      'strong': 'strong',
      'em': 'em',
    },
    allowedStyles: {
      '*': {
        'color': [/^.*$/],
        'background-color': [/^.*$/],
        'font-weight': [/^.*$/],
        'font-size': [/^.*$/],
        'text-decoration': [/^.*$/],
      },
    },
  });

  cleaned = cleaned.replace(/<span style="[^"]*">/g, '<span>').replace(/<\/span>/g, '</span>');
  cleaned = cleaned.replace(/<p>\s*<\/p>/g, '');
  cleaned = cleaned.replace(/<p>(<h[1-4]>)/g, '$1');
  cleaned = cleaned.replace(/(<\/h[1-4]>)<\/p>/g, '$1');
  
  return cleaned;
};

const slashCommandsList = [
  { title: "Heading 1", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run(), icon: Heading1 },
  { title: "Heading 2", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run(), icon: Heading2 },
  { title: "Heading 3", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run(), icon: Heading3 },
  { title: "Bullet List", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run(), icon: List },
  { title: "Numbered List", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleOrderedList().run(), icon: ListOrdered },
  { title: "Quote", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBlockquote().run(), icon: Quote },
  { title: "Code Block", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleCodeBlock().run(), icon: Code },
  { title: "Divider", command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setHorizontalRule().run(), icon: Minus },
];

const SlashMenu = ({ items, onSelect, commandListRef }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useImperativeHandle(commandListRef, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        onSelect(items[selectedIndex]);
        return true;
      }
      if (event.key === "Escape") {
        return true;
      }
      return false;
    },
  }));

  if (!items.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden min-w-[200px] z-50">
      <div className="p-1">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors",
                index === selectedIndex ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
              )}
              onClick={() => onSelect(item)}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const FloatingToolbar = ({ editor, position, visible }) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  useEffect(() => {
    if (!visible) {
      setShowLinkInput(false);
      setLinkUrl("");
    }
  }, [visible]);

  if (!visible || !position || !editor) return null;

  return (
    <div 
      className="fixed z-50 flex items-center gap-0.5 px-1 py-1 bg-gray-900 rounded-full shadow-lg animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: position.left,
        top: position.top - 48,
        transform: 'translateX(-50%)',
      }}
    >
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-2 rounded-full transition-colors text-white",
          editor.isActive("bold") ? "bg-gray-700" : "hover:bg-gray-700"
        )}
        title="Bold (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-2 rounded-full transition-colors text-white",
          editor.isActive("italic") ? "bg-gray-700" : "hover:bg-gray-700"
        )}
        title="Italic (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-2 rounded-full transition-colors text-white",
          editor.isActive("underline") ? "bg-gray-700" : "hover:bg-gray-700"
        )}
        title="Underline (Ctrl+U)"
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "p-2 rounded-full transition-colors text-white",
          editor.isActive("strike") ? "bg-gray-700" : "hover:bg-gray-700"
        )}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-gray-600" />
      <button
        type="button"
        onClick={() => setShowLinkInput(true)}
        className={cn(
          "p-2 rounded-full transition-colors text-white",
          editor.isActive("link") ? "bg-gray-700" : "hover:bg-gray-700"
        )}
        title="Link (Ctrl+K)"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      {showLinkInput && (
        <div className="flex items-center gap-1 px-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSetLink()}
            placeholder="Enter URL..."
            className="px-2 py-1 text-sm bg-gray-800 text-white rounded border border-gray-600 outline-none w-40"
            autoFocus
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="p-1 text-white hover:text-gray-300"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
            }}
            className="p-1 text-white hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {!showLinkInput && (
        <>
          <div className="w-px h-6 bg-gray-600" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              "px-2 rounded-full transition-colors text-white text-sm font-bold",
              editor.isActive("heading", { level: 1 }) ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              "px-2 rounded-full transition-colors text-white text-sm font-bold",
              editor.isActive("heading", { level: 2 }) ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              "px-2 rounded-full transition-colors text-white text-sm font-bold",
              editor.isActive("heading", { level: 3 }) ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Heading 3"
          >
            H3
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
            className={cn(
              "px-2 rounded-full transition-colors text-white text-sm font-bold",
              editor.isActive("heading", { level: 4 }) ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Heading 4"
          >
            H4
          </button>
          <div className="w-px h-6 bg-gray-600" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-2 rounded-full transition-colors text-white",
              editor.isActive("bulletList") ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-2 rounded-full transition-colors text-white",
              editor.isActive("orderedList") ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-2 rounded-full transition-colors text-white",
              editor.isActive("blockquote") ? "bg-gray-700" : "hover:bg-gray-700"
            )}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

const MediumEditor = forwardRef(({ 
  content = "", 
  onChange, 
  placeholder = "Tell your story...",
  className,
}, ref) => {
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);
  const slashMenuRef = useRef(null);
  const editorContainerRef = useRef(null);
  const isInitialMount = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        inputRules: true,
        link: false,
        image: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-green-600 underline hover:text-green-700 cursor-pointer",
          rel: "noopener noreferrer nofollow",
          'data-href': (node) => node.attrs.href,
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return node.attrs.level === 1 ? "Title" : `Heading ${node.attrs.level}`;
          }
          return placeholder;
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Typography,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content || '',
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
      
      const { from } = ed.state.selection;
      const text = ed.state.doc.textBetween(Math.max(0, from - 1), from);
      
      if (text === "/") {
        setShowSlashMenu(true);
        setSlashQuery("");
      } else if (showSlashMenu && text.startsWith("/")) {
        const query = text.slice(1);
        setSlashQuery(query);
      } else if (showSlashMenu && text === "") {
        setShowSlashMenu(false);
      }

      if (!ed.state.selection.empty && ed.state.selection.content().size > 0) {
        const { from, to } = ed.state.selection;
        const start = ed.view.coordsAtPos(from);
        const end = ed.view.coordsAtPos(to);
        
        setToolbarPosition({
          left: (start.left + end.left) / 2,
          top: start.top,
        });
        setToolbarVisible(true);
      } else {
        setToolbarVisible(false);
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (!ed.state.selection.empty && ed.state.selection.content().size > 0) {
        const { from, to } = ed.state.selection;
        const start = ed.view.coordsAtPos(from);
        const end = ed.view.coordsAtPos(to);
        
        setToolbarPosition({
          left: (start.left + end.left) / 2,
          top: start.top,
        });
        setToolbarVisible(true);
      } else {
        setToolbarVisible(false);
      }
      setShowSlashMenu(false);
    },
    editorProps: {
      attributes: {
        class: "medium-editor prose prose-lg max-w-none focus:outline-none min-h-[400px]",
      },
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData("text/html");
        const text = event.clipboardData?.getData("text/plain");

        if (html) {
          const cleaned = cleanWordHTML(html);
          
          if (cleaned.trim() && cleaned !== '<p></p>') {
            const { tr } = view.state;
            const parsed = view.state.schema.parseHTML(cleaned);
            
            if (parsed.length > 0) {
              const frag = view.state.doc.cut(view.state.selection.from).replaceWith(view.state.selection.from, parsed);
              tr.insert(view.state.selection.from, frag.content);
              view.dispatch(tr);
              return true;
            }
          }
        }
        
        if (text && !html) {
          let plainText = text;
          plainText = plainText.split(/<\/?div[^>]*>/).join('\n');
          plainText = plainText.split(/<br\s*\/?>/).join('\n');
          plainText = plainText.split(/<\/p>/).join('\n\n');
          plainText = plainText.replace(/<[^>]+>/g, '').trim();
          
          if (plainText) {
            view.dispatch(view.state.tr.insertText(plainText));
            return true;
          }
        }
        
        return false;
      },
    },
  });

  useEffect(() => {
    if (content) {
      isInitialMount.current = false;
    }
  }, [content]);

  useEffect(() => {
    if (editor && isInitialMount.current === false && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
    setContent: (newContent) => {
      if (editor && newContent !== editor.getHTML()) {
        editor.commands.setContent(newContent);
      }
    },
  }));

  if (!editor) return null;

  const handleSlashSelect = useCallback((item) => {
    if (!editor || !item) return;
    
    const { from } = editor.state.selection;
    const text = editor.state.doc.textBetween(Math.max(0, from - slashQuery.length - 1), from);
    
    if (text.startsWith("/")) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - slashQuery.length - 1, to: from })
        .run();
    }
    
    item.command({ editor, range: { from: from - slashQuery.length - 1, to: from } });
    setShowSlashMenu(false);
    setSlashQuery("");
  }, [editor, slashQuery]);

  const addImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !editor) return;
      
      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/posts/upload", {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.url) {
            editor.chain().focus().setImage({ src: data.data.url }).run();
          }
        }
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    };
    input.click();
  }, [editor]);

  const filteredSlashCommands = slashCommandsList.filter((item) =>
    item.title.toLowerCase().includes(slashQuery.toLowerCase())
  );

  return (
    <div 
      ref={editorContainerRef}
      className={cn("medium-editor-container relative", className)}
    >
      {showSlashMenu && slashQuery.length < 10 && (
        <div 
          className="absolute z-50"
          style={{
            top: "100%",
            left: 0,
          }}
        >
          <SlashMenu 
            items={filteredSlashCommands} 
            onSelect={handleSlashSelect}
            commandListRef={slashMenuRef}
          />
        </div>
      )}
      
      <FloatingToolbar 
        editor={editor} 
        position={toolbarPosition}
        visible={toolbarVisible}
      />

      <EditorContent editor={editor} />
    </div>
  );
});

MediumEditor.displayName = "MediumEditor";

export default MediumEditor;
export { cleanWordHTML };