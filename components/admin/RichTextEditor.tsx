'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import ImageExtension from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Youtube from '@tiptap/extension-youtube'
import { toast } from 'sonner'
import {
  Bold, Italic, Strikethrough, Code, Code2, Quote, List, ListOrdered,
  Link, Upload, Table as TableIcon, Minus, Undo, Redo,
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
      }),
      ImageExtension.configure({
        allowBase64: true,
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: 10000 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Youtube.configure({ HTMLAttributes: { class: 'w-full aspect-video rounded-lg' } }),
    ],
    content: '',
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Set initial content when editor mounts OR when content changes from empty to a value
  useEffect(() => {
    if (editor && content && editor.isEmpty) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      return json.url || null
    } catch {
      toast.error('Image upload failed')
      return null
    }
  }

  return (
    <div className="border border-[var(--border)] rounded-[var(--radius)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[var(--border)] bg-[var(--surface-raised)]">
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline Code">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="H1">H1</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="H2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={editor?.isActive('heading', { level: 3 })} title="H3">H3</ToolbarButton>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Ordered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive('codeBlock')} title="Code Block">
          <Code2 className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <ToolbarButtonLink editor={editor} />
        <ToolbarButtonImageUpload editor={editor} onUpload={handleImageUpload} />
        <ToolbarButton onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-[var(--border)] mx-1" />
        <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()} title="Undo">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()} title="Redo">
          <Redo className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="prose prose-sm max-w-none p-4 focus:outline-none
          [&_h1]:text-2xl [&_h1]:font-black [&_h1]:text-[var(--text-primary)]
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)]
          [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[var(--text-primary)]
          [&_p]:text-[var(--text-secondary)] [&_p]:leading-relaxed
          [&_blockquote]:border-l-[var(--primary)] [&_blockquote]:bg-[var(--surface-raised)]
          [&_code]:bg-[var(--surface-raised)] [&_code]:text-[var(--danger)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
          [&_pre]:bg-[#0E0E14] [&_pre]:text-white [&_pre]:rounded-lg [&_pre]:p-4
          [&_table]:w-full [&_table]:border-collapse
          [&_th]:bg-[var(--surface-raised)] [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_th]:text-xs [&_th]:font-bold
          [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_td]:text-sm
          [&_a]:text-[var(--primary)] [&_a]:underline
          [&_hr]:border-[var(--border)]"
      />
    </div>
  )
}

// ─── Toolbar button components (internal — not exported) ────────

function ToolbarButton({ onClick, active, disabled, title, children }: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded text-xs font-bold transition-colors ${
        active
          ? 'bg-[var(--primary)] text-white'
          : disabled
            ? 'text-[var(--text-muted)] opacity-30 cursor-not-allowed'
            : 'text-[var(--text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]'
      }`}
    >
      {children}
    </button>
  )
}

function ToolbarButtonLink({ editor }: { editor: Editor | null }) {
  const handleClick = () => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl || 'https://')
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  return (
    <ToolbarButton onClick={handleClick} active={editor?.isActive('link')} title="Insert Link">
      <Link className="w-4 h-4" />
    </ToolbarButton>
  )
}

function ToolbarButtonImageUpload({ editor, onUpload }: {
  editor: Editor | null
  onUpload: (file: File) => Promise<string | null>
}) {
  const handleClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const url = await onUpload(file)
      if (url) {
        editor?.chain().focus().setImage({ src: url }).run()
      }
    }
    input.click()
  }

  return (
    <ToolbarButton onClick={handleClick} title="Insert Image">
      <Upload className="w-4 h-4" />
    </ToolbarButton>
  )
}
