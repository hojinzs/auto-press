"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
} from "lucide-react";
import { normalizeDraftLinkHref } from "@/lib/draft-content";
import { cn } from "@/lib/utils";

type WordPressEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  isActive = false,
  disabled = false,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
        disabled
          ? "cursor-not-allowed border-border/60 text-muted-foreground/50"
          : isActive
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function WordPressEditor({
  value,
  onChange,
  disabled = false,
}: WordPressEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: "워드프레스 본문을 작성하세요.",
      }),
    ],
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] rounded-b-2xl px-4 py-4 focus:outline-none prose prose-neutral dark:prose-invert max-w-none prose-h2:text-xl prose-h2:font-bold prose-h2:tracking-tight prose-h2:mt-8 prose-h2:mb-3 prose-h3:text-lg prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-7 prose-li:leading-7 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.isEmpty ? "" : currentEditor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.isEmpty ? "" : editor.getHTML();
    if (currentHtml === value) return;

    editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const setLink = () => {
    if (!editor || disabled) return;

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const nextUrl = window.prompt("링크 URL", previousUrl ?? "https://");

    if (nextUrl === null) return;

    if (!nextUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const normalizedHref = normalizeDraftLinkHref(nextUrl);

    if (!normalizedHref) {
      window.alert("http, https, mailto 또는 상대 경로 링크만 사용할 수 있습니다.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalizedHref }).run();
  };

  if (!editor) {
    return (
      <div className="rounded-2xl border">
        <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
          에디터를 불러오는 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-wrap gap-2 border-b bg-muted/30 p-3">
        <ToolbarButton
          label="문단"
          onClick={() => editor.chain().focus().setParagraph().run()}
          isActive={editor.isActive("paragraph")}
          disabled={disabled}
        >
          <Pilcrow className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="소제목"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          disabled={disabled}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="보조 소제목"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          disabled={disabled}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="굵게"
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={disabled}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="기울임"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={disabled}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="글머리 목록"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="번호 목록"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="인용"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          disabled={disabled}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="링크"
          onClick={setLink}
          isActive={editor.isActive("link")}
          disabled={disabled}
        >
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="서식 지우기"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          disabled={disabled}
        >
          <RemoveFormatting className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="되돌리기"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled || !editor.can().chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="다시하기"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled || !editor.can().chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />

      <div className="border-t bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
        워드프레스 본문용 기본 서식만 지원합니다. 이미지 업로드는 이번 범위에 포함되지 않습니다.
      </div>
    </div>
  );
}
