'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
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
