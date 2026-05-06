import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Code, Quote,
  Highlighter, Palette, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS = [
  "#f8f5f0", "#94a3b8", "#f87171", "#fb923c", "#fbbf24",
  "#4ade80", "#34d399", "#60a5fa", "#a78bfa", "#f472b6",
  "#dc2626", "#ea580c", "#d97706", "#16a34a", "#0284c7", "#7c3aed",
];
const HIGHLIGHTS = [
  "#fbbf2450", "#4ade8040", "#60a5fa40", "#f472b640", "#a78bfa40", "#fb923c40",
];

interface ToolbarBtnProps {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarBtn({ onClick, active, title, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "inline-flex items-center justify-center size-7 rounded text-sm transition-colors",
        active
          ? "bg-white/15 text-foreground"
          : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-white/10 mx-0.5" />;
}

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [showColor, setShowColor] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder || "Start writing…" }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external content changes (tab switch) without emitting update
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "", false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-white/[0.02] sticky top-0 z-10 shrink-0">
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (⌘B)">
          <Bold className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (⌘I)">
          <Italic className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (⌘U)">
          <UnderlineIcon className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
          <Strikethrough className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
          <Heading1 className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <Heading2 className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <Heading3 className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
          <AlignLeft className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
          <AlignCenter className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
          <AlignRight className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Text color */}
        <div className="relative">
          <ToolbarBtn onClick={() => { setShowColor(!showColor); setShowHighlight(false); }} title="Text color">
            <Palette className="size-3.5" />
          </ToolbarBtn>
          {showColor && (
            <div className="absolute top-8 left-0 z-50 bg-[#1B1F24] border border-border rounded-xl p-2.5 shadow-2xl min-w-[188px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 px-0.5">Text color</p>
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(c).run(); setShowColor(false); }}
                    className="size-5 rounded border border-white/10 hover:scale-125 transition-transform"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColor(false); }}
                className="mt-2 w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground py-0.5 transition-colors"
              >
                Reset color
              </button>
            </div>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <ToolbarBtn onClick={() => { setShowHighlight(!showHighlight); setShowColor(false); }} title="Highlight" active={editor.isActive("highlight")}>
            <Highlighter className="size-3.5" />
          </ToolbarBtn>
          {showHighlight && (
            <div className="absolute top-8 left-0 z-50 bg-[#1B1F24] border border-border rounded-xl p-2.5 shadow-2xl">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 px-0.5">Highlight</p>
              <div className="flex gap-1">
                {HIGHLIGHTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: c }).run(); setShowHighlight(false); }}
                    className="size-6 rounded border border-white/10 hover:scale-125 transition-transform"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlight(false); }}
                className="mt-2 w-full text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground py-0.5 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto notes-editor cursor-text"
        onClick={() => editor.commands.focus()}
      />
    </div>
  );
}
