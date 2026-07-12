import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Search, Plus, Trash2, Tag, BookOpen, Edit, Eye, LayoutGrid, FileText, ChevronRight } from 'lucide-react';

export interface DocumentNote {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Inline Markdown Parser Engine
const parseInlineMarkdown = (text: string): string => {
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  
  // Italic *text*
  escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>');

  // Inline code `code`
  escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[12px] text-emerald-600 font-semibold">$1</code>');

  // Links [text](url)
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:underline font-medium">$1</a>');

  return escaped;
};

const parseMarkdownToHtml = (md: string): string => {
  const lines = md.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  const htmlLines: string[] = [];

  for (let line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        htmlLines.push(`<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto my-3">${codeBlockContent.join('\n')}</pre>`);
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      continue;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
        htmlLines.push('<ul class="list-disc pl-5 my-2 space-y-1 text-slate-700 text-sm">');
      }
      const listText = line.replace(/^\s*[-*]\s+/, '');
      htmlLines.push(`<li>${parseInlineMarkdown(listText)}</li>`);
      continue;
    } else {
      if (inList) {
        inList = false;
        htmlLines.push('</ul>');
      }
    }

    // Headers
    if (line.startsWith('# ')) {
      htmlLines.push(`<h1 class="text-2xl font-extrabold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-2">${parseInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlLines.push(`<h2 class="text-xl font-bold text-slate-850 mt-5 mb-2 border-b border-slate-100 pb-1">${parseInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlLines.push(`<h3 class="text-lg font-bold text-slate-800 mt-4 mb-2">${parseInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.trim() === '') {
      htmlLines.push('<p class="h-2"></p>');
    } else {
      htmlLines.push(`<p class="text-slate-700 leading-relaxed text-sm my-1.5">${parseInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
};

export const DocumentManager: React.FC = () => {
  const [notes, setNotes] = useLocalStorage<DocumentNote[]>('my-monitor-notes', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split');

  // Currently selected active note
  const activeNote = useMemo(() => {
    const note = notes.find(n => n.id === activeNoteId);
    if (note) {
      return note;
    }
    return null;
  }, [notes, activeNoteId]);

  // Load selected note into editor
  const handleSelectNote = (note: DocumentNote) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
  };

  // List of all unique tags
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagsSet.add(tag.trim().toLowerCase()));
    });
    return Array.from(tagsSet).filter(Boolean);
  }, [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTag = selectedTag 
        ? note.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase()) 
        : true;

      return matchesSearch && matchesTag;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, selectedTag]);

  // Create a new empty note
  const handleNewNote = () => {
    const newNote: DocumentNote = {
      id: crypto.randomUUID(),
      title: 'Untitled Note',
      content: '# Untitled Note\n\nWrite your markdown content here...\n\n- Good habits to check\n- Read a book today',
      tags: ['draft'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes([newNote, ...notes]);
    handleSelectNote(newNote);
  };

  // Save current edits
  const handleSaveNote = () => {
    if (!activeNoteId) return;

    const parsedTags = editTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updatedNotes = notes.map(note => {
      if (note.id === activeNoteId) {
        return {
          ...note,
          title: editTitle.trim() || 'Untitled Note',
          content: editContent,
          tags: parsedTags,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    });

    setNotes(updatedNotes);
  };

  // Delete note
  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      const remainingNotes = notes.filter(n => n.id !== id);
      setNotes(remainingNotes);
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setEditTitle('');
        setEditContent('');
        setEditTags('');
      }
    }
  };

  const renderedPreview = useMemo(() => {
    return parseMarkdownToHtml(editContent);
  }, [editContent]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-0 py-6 pb-24 md:pb-6 h-[calc(100vh-80px)] flex flex-col md:flex-row gap-6">
      {/* Left Pane - Document Catalog list */}
      <div className="w-full md:w-80 flex flex-col shrink-0 gap-4 h-full">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              Knowledge Base <BookOpen className="w-4 h-4 text-emerald-500" />
            </h2>
            <button
              onClick={handleNewNote}
              className="flex items-center space-x-1 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides, notes..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs transition-all"
            />
          </div>

          {/* Tag Filter Strip */}
          {allTags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filter by Tag</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                    selectedTag === null
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full transition-all flex items-center gap-0.5 ${
                      selectedTag === tag
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Tag className="w-2.5 h-2.5 opacity-65" />
                    <span>{tag}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes List Scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
              <FileText className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-slate-500 text-xs">No documents found.</p>
            </div>
          ) : (
            filteredNotes.map(note => (
              <button
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start justify-between group ${
                  activeNoteId === note.id
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-1.5 min-w-0 pr-2">
                  <h4 className="font-semibold text-slate-850 text-sm truncate leading-snug group-hover:text-emerald-600 transition-colors">
                    {note.title}
                  </h4>
                  <p className="text-slate-400 text-[10px] block">
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map(t => (
                      <span key={t} className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-0.5" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Rich text workspace */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
        {activeNote ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center space-x-1.5 bg-slate-100 p-0.5 rounded-xl">
                <button
                  onClick={() => setEditorMode('edit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    editorMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Write</span>
                </button>
                <button
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    editorMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setEditorMode('split')}
                  className={`hidden lg:flex px-3 py-1.5 rounded-lg text-xs font-semibold items-center space-x-1 transition-all ${
                    editorMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Split Screen</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="text-slate-400 hover:text-red-500 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Delete Document"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={handleSaveNote}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4.5 py-2 rounded-xl text-xs shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Workspace details header */}
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 space-y-3 shrink-0">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => {
                  setEditTitle(e.target.value);
                  handleSaveNote();
                }}
                onBlur={handleSaveNote}
                placeholder="Document Title"
                className="w-full bg-transparent font-extrabold text-slate-900 text-xl border-none focus:outline-none focus:ring-0 p-0 placeholder-slate-350"
              />
              <div className="flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => {
                    setEditTags(e.target.value);
                    handleSaveNote();
                  }}
                  onBlur={handleSaveNote}
                  placeholder="tags, separated, by, commas"
                  className="flex-1 bg-transparent border-none text-xs text-slate-500 focus:outline-none focus:ring-0 p-0 placeholder-slate-350"
                />
              </div>
            </div>

            {/* Editing Box */}
            <div className="flex-1 flex overflow-hidden">
              {/* Writer */}
              {(editorMode === 'edit' || editorMode === 'split') && (
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value);
                    handleSaveNote();
                  }}
                  onBlur={handleSaveNote}
                  placeholder="Write your markdown here... Use # for title, ## for subtitles, - for list items, **bold**, *italic*, `code` and [text](link)"
                  className="flex-1 h-full p-6 text-sm font-mono text-slate-800 border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed border-r border-slate-50 bg-white"
                />
              )}

              {/* Previewer */}
              {(editorMode === 'preview' || (editorMode === 'split')) && (
                <div
                  className={`flex-1 h-full p-6 overflow-y-auto prose max-w-none text-slate-850 bg-slate-50/20 ${
                    editorMode === 'split' ? 'hidden lg:block' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: renderedPreview }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-slate-800 font-bold text-base">Workspace is Empty</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
              Select an existing notes file from the sidebar catalogue, or create a new document to start mapping guides and thoughts.
            </p>
            <button
              onClick={handleNewNote}
              className="mt-4 bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default DocumentManager;
