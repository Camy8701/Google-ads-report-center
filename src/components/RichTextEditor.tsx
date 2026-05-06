import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Code, Quote,
  Highlighter, Palette, Minus, Pipette,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Color palette organised by hue ─────────────────────────────────────────
const COLOR_GROUPS = [
  {
    label: "Neutral",
    colors: ["#000000", "#1c1c1c", "#3d3d3d", "#616161", "#888888", "#adadad", "#d4d4d4", "#ffffff"],
  },
  {
    label: "Red",
    colors: ["#450a0a", "#7f1d1d", "#b91c1c", "#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"],
  },
  {
    label: "Orange · Yellow",
    colors: ["#431407", "#9a3412", "#c2410c", "#ea580c", "#f97316", "#fbbf24", "#fde68a", "#fef9c3"],
  },
  {
    label: "Green",
    colors: ["#052e16", "#14532d", "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"],
  },
  {
    label: "Blue · Teal",
    colors: ["#0c1a4e", "#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#67e8f9"],
  },
  {
    label: "Purple · Pink",
    colors: ["#2e1065", "#6b21a8", "#7c3aed", "#a855f7", "#c084fc", "#e879f9", "#f472b6", "#fda4af"],
  },
];

// ── Highlight swatches ──────────────────────────────────────────────────────
const HIGHLIGHT_GROUPS = [
  {
    label: "Warm",
    colors: ["#fbbf2460", "#f9731660", "#ef444455", "#fda4af60"],
  },
  {
    label: "Cool",
    colors: ["#4ade8050", "#60a5fa50", "#a855f750", "#e879f950"],
  },
];

// ── Small helper components ─────────────────────────────────────────────────
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
  return <div className="w-px h-4 bg-white/10 mx-0.5 shrink-0" />;
}

// ── Color swatch ────────────────────────────────────────────────────────────
function Swatch({ color, size = 5, onClick, border = true }: { color: string; size?: number; onClick: (c: string) => void; border?: boolean }) {
  const isBlack = color === "#000000";
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(color); }}
      className={cn(
        `size-${size} rounded hover:scale-125 transition-transform shrink-0`,
        border && "border border-white/15",
        isBlack && "border-white/30",
      )}
      style={{ background: color }}
      title={color}
    />
  );
}

// ── Custom color picker button ──────────────────────────────────────────────
function CustomColorPicker({ onPick, label = "Custom" }: { onPick: (c: string) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <label
      className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground transition-colors group"
      title="Pick any color"
    >
      <div className="inline-flex items-center justify-center size-5 rounded border border-white/20 bg-gradient-to-br from-rose-500 via-green-400 to-blue-500 group-hover:scale-110 transition-transform">
        <Pipette className="size-3 text-white drop-shadow" />
      </div>
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
      <input
        ref={inputRef}
        type="color"
        className="sr-only"
        defaultValue="#ffffff"
        onChange={(e) => onPick(e.target.value)}
      />
    </label>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
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

  const applyColor = (c: string) => {
    editor.chain().focus().setColor(c).run();
    setShowColor(false);
  };

  const applyHighlight = (c: string) => {
    editor.chain().focus().toggleHighlight({ color: c }).run();
    setShowHighlight(false);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-white/[0.02] sticky top-0 z-10 shrink-0">

        {/* Format */}
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

        {/* Headings */}
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

        {/* Lists */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
          <List className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
          <ListOrdered className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* Align */}
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

        {/* Code / Quote / Divider */}
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
          <Code className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
          <Quote className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal divider">
          <Minus className="size-3.5" />
        </ToolbarBtn>

        <Sep />

        {/* ── Text color ─────────────────────────────────────────────── */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => { setShowColor(!showColor); setShowHighlight(false); }}
            title="Text color"
            active={showColor}
          >
            <Palette className="size-3.5" />
          </ToolbarBtn>

          {showColor && (
            <div className="absolute top-8 left-0 z-50 bg-[#1B1F24] border border-border rounded-xl p-3 shadow-2xl w-[232px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Text color</p>

              <div className="space-y-1.5">
                {COLOR_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">{group.label}</p>
                    <div className="flex gap-1">
                      {group.colors.map((c) => (
                        <Swatch key={c} color={c} onClick={applyColor} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <CustomColorPicker onPick={applyColor} label="Custom" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColor(false); }}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Highlight ──────────────────────────────────────────────── */}
        <div className="relative">
          <ToolbarBtn
            onClick={() => { setShowHighlight(!showHighlight); setShowColor(false); }}
            title="Highlight"
            active={editor.isActive("highlight") || showHighlight}
          >
            <Highlighter className="size-3.5" />
          </ToolbarBtn>

          {showHighlight && (
            <div className="absolute top-8 left-0 z-50 bg-[#1B1F24] border border-border rounded-xl p-3 shadow-2xl w-[200px]">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Highlight</p>

              <div className="space-y-1.5">
                {HIGHLIGHT_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 mb-1">{group.label}</p>
                    <div className="flex gap-1">
                      {group.colors.map((c) => (
                        <Swatch key={c} color={c} size={6} onClick={applyHighlight} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <CustomColorPicker onPick={applyHighlight} label="Custom" />
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlight(false); }}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Editor content ─────────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="flex-1 overflow-y-auto notes-editor cursor-text"
        onClick={() => editor.commands.focus()}
      />
    </div>
  );
}
