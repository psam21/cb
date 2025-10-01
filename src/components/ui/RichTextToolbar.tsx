'use client';

import { Editor } from '@tiptap/react';
import { useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  List, 
  ListOrdered,
  ListTodo,
  Heading1, 
  Heading2, 
  Heading3,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  Highlighter,
  Palette,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Video,
  Undo,
  Redo,
  RemoveFormatting,
  ChevronDown,
} from 'lucide-react';

interface RichTextToolbarProps {
  editor: Editor;
}

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);

  const colors = [
    '#000000', '#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'
  ];

  const highlights = [
    '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5', '#E9D5FF', '#FCE7F3', 'transparent'
  ];

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    label,
    disabled = false,
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: React.ElementType; 
    label: string;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive ? 'bg-primary-100 text-primary-800' : 'text-gray-600'
      }`}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  const addYoutubeVideo = useCallback(() => {
    if (youtubeUrl) {
      editor.chain().focus().setYoutubeVideo({ src: youtubeUrl }).run();
      setYoutubeUrl('');
      setShowYoutubeInput(false);
    }
  }, [editor, youtubeUrl]);

  return (
    <div className="border-b border-gray-200">
      <div className="flex items-center gap-1 p-2 flex-wrap">
        {/* History */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          icon={Undo}
          label="Undo"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          icon={Redo}
          label="Redo"
        />
        
        <Divider />
        
        {/* Text Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
          label="Italic"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          icon={UnderlineIcon}
          label="Underline"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          icon={Strikethrough}
          label="Strikethrough"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          icon={Code}
          label="Code"
        />
        
        <Divider />
        
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          icon={Heading1}
          label="Heading 1"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          icon={Heading3}
          label="Heading 3"
        />
        
        <Divider />
        
        {/* Text Alignment */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAlignMenu(!showAlignMenu)}
            className="p-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-1"
            title="Text Alignment"
          >
            {editor.isActive({ textAlign: 'left' }) && <AlignLeft className="w-4 h-4" />}
            {editor.isActive({ textAlign: 'center' }) && <AlignCenter className="w-4 h-4" />}
            {editor.isActive({ textAlign: 'right' }) && <AlignRight className="w-4 h-4" />}
            {editor.isActive({ textAlign: 'justify' }) && <AlignJustify className="w-4 h-4" />}
            {!editor.isActive({ textAlign: 'left' }) && !editor.isActive({ textAlign: 'center' }) && 
             !editor.isActive({ textAlign: 'right' }) && !editor.isActive({ textAlign: 'justify' }) && 
             <AlignLeft className="w-4 h-4" />}
            <ChevronDown className="w-3 h-3" />
          </button>
          {showAlignMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 p-1">
              <button
                type="button"
                onClick={() => { editor.chain().focus().setTextAlign('left').run(); setShowAlignMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                <AlignLeft className="w-4 h-4" />
                Left
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().setTextAlign('center').run(); setShowAlignMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                <AlignCenter className="w-4 h-4" />
                Center
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().setTextAlign('right').run(); setShowAlignMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                <AlignRight className="w-4 h-4" />
                Right
              </button>
              <button
                type="button"
                onClick={() => { editor.chain().focus().setTextAlign('justify').run(); setShowAlignMenu(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                <AlignJustify className="w-4 h-4" />
                Justify
              </button>
            </div>
          )}
        </div>
        
        <Divider />
        
        {/* Colors */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 p-2">
              <div className="grid grid-cols-4 gap-1 mb-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                className="w-full text-xs px-2 py-1 hover:bg-gray-100 rounded"
              >
                Reset
              </button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHighlightPicker(!showHighlightPicker)}
            className="p-2 rounded hover:bg-gray-100 transition-colors"
            title="Highlight"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 p-2">
              <div className="grid grid-cols-4 gap-1 mb-2">
                {highlights.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { 
                      if (color === 'transparent') {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor.chain().focus().setHighlight({ color }).run();
                      }
                      setShowHighlightPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color === 'transparent' ? 'None' : color}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Divider />
        
        {/* Subscript/Superscript */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          isActive={editor.isActive('subscript')}
          icon={SubscriptIcon}
          label="Subscript"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          isActive={editor.isActive('superscript')}
          icon={SuperscriptIcon}
          label="Superscript"
        />
        
        <Divider />
        
        {/* Link */}
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('link')) {
              editor.chain().focus().unsetLink().run();
            } else {
              setShowLinkInput(true);
              setLinkUrl(editor.getAttributes('link').href || '');
            }
          }}
          isActive={editor.isActive('link')}
          icon={editor.isActive('link') ? Unlink : LinkIcon}
          label={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
        />
        
        <Divider />
        
        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
          label="Bullet List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
          label="Numbered List"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive('taskList')}
          icon={ListTodo}
          label="Task List"
        />
        
        <Divider />
        
        {/* Other blocks */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
          label="Blockquote"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          icon={Minus}
          label="Horizontal Rule"
        />
        
        <Divider />
        
        {/* Table */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTableMenu(!showTableMenu)}
            className={`p-2 rounded hover:bg-gray-100 transition-colors ${
              editor.isActive('table') ? 'bg-primary-100 text-primary-800' : ''
            }`}
            title="Table"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          {showTableMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-10 p-1 min-w-[160px]">
              <button
                type="button"
                onClick={() => { 
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); 
                  setShowTableMenu(false); 
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                Insert Table (3x3)
              </button>
              {editor.isActive('table') && (
                <>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addColumnBefore().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Add Column Before
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Add Column After
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600"
                  >
                    Delete Column
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addRowBefore().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Add Row Before
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
                  >
                    Add Row After
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600"
                  >
                    Delete Row
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm text-red-600"
                  >
                    Delete Table
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Video */}
        <ToolbarButton
          onClick={() => setShowYoutubeInput(true)}
          icon={Video}
          label="Embed YouTube Video"
        />
        
        <Divider />
        
        {/* Clear Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          icon={RemoveFormatting}
          label="Clear Formatting"
        />
      </div>
      
      {/* Link Input Modal */}
      {showLinkInput && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setLink();
                } else if (e.key === 'Escape') {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }
              }}
              placeholder="https://example.com"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={setLink}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Set Link
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* YouTube Input Modal */}
      {showYoutubeInput && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addYoutubeVideo();
                } else if (e.key === 'Escape') {
                  setShowYoutubeInput(false);
                  setYoutubeUrl('');
                }
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={addYoutubeVideo}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
            >
              Add Video
            </button>
            <button
              type="button"
              onClick={() => {
                setShowYoutubeInput(false);
                setYoutubeUrl('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
