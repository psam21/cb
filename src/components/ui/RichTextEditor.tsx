'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Strike } from '@tiptap/extension-strike';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Youtube from '@tiptap/extension-youtube';
import { Markdown } from 'tiptap-markdown';
import { RichTextToolbar } from './RichTextToolbar';
import { useEffect } from 'react';

interface MarkdownStorage {
  markdown: {
    getMarkdown: () => string;
  };
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  error?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  maxLength,
  minHeight = 200,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 underline hover:text-primary-700',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Strike,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Export as markdown for Nostr NIP-23 events
      const storage = editor.storage as unknown as MarkdownStorage;
      const markdown = storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none px-4 py-3`,
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor) {
      const storage = editor.storage as unknown as MarkdownStorage;
      if (value !== storage.markdown?.getMarkdown()) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-primary-500`}>
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
      
      {maxLength && (
        <div className={`px-4 py-2 text-sm text-right border-t ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
          {characterCount} / {maxLength}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 px-4 py-2">{error}</p>
      )}
    </div>
  );
}
