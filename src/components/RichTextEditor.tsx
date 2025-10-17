"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useState, useEffect } from 'react';

interface RichTextEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (content: string) => void;
  title: string;
}

export function RichTextEditor({ isOpen, onClose, initialContent, onSave, title }: RichTextEditorProps) {
  const [content, setContent] = useState(initialContent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
    ],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!isOpen) return null;

  const handleSave = () => {
    const textContent = editor?.getText() || '';
    onSave(textContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3 border-b bg-gray-50 flex flex-wrap gap-2">
          <button
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor?.isActive('bold')
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <strong>B</strong>
          </button>
          
          <button
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor?.isActive('italic')
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <em>I</em>
          </button>

          <button
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor?.isActive('bulletList')
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            • List
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              editor?.isActive('heading', { level: 3 })
                ? 'bg-sky-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            H3
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1"></div>

          <button
            onClick={() => editor?.chain().focus().undo().run()}
            className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100"
          >
            ↶ Undo
          </button>
          
          <button
            onClick={() => editor?.chain().focus().redo().run()}
            className="px-3 py-1 rounded text-sm font-medium bg-white text-gray-700 hover:bg-gray-100"
          >
            ↷ Redo
          </button>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus-within:outline-none text-gray-900"
            style={{
              minHeight: '300px',
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Use the toolbar above to format your text. Changes are applied in real-time.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}