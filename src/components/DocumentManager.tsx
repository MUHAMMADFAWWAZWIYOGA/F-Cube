import React, { useState, useMemo, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Search, Plus, Trash2, Tag, BookOpen, Edit, Eye, FileText, ChevronRight, ArrowLeft } from 'lucide-react';

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

  escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
  escaped = escaped.replace(/\*(.*?)\*/g, '<em class="italic text-[#8b9bb4]">$1</em>');
  escaped = escaped.replace(/`(.*?)`/g, '<code class="bg-[#1c2b3a] px-1 py-0.5 rounded-none font-mono text-[11px] text-[#ff9f30]">$1</code>');
  escaped = escaped.replace(/\[(.*?)\]\((.*?)\)/g, (_match, label: string, href: string) => {
    const trimmedHref = href.trim();
    const isSafeUrl = /^(https?:\/\/|mailto:)/i.test(trimmedHref);
    if (!isSafeUrl) {
      return label;
    }

    const safeHref = trimmedHref.replace(/"/g, '&quot;');
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" class="text-[#00ff9d] hover:underline font-medium">${label}</a>`;
  });

  return escaped;
};

const parseMarkdownToHtml = (md: string): string => {
  const lines = md.split('\n');
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let inList = false;
  const htmlLines: string[] = [];

  for (let line of lines) {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        htmlLines.push(`<pre class="bg-[#0b1623] border border-[#1c2b3a] p-3 font-mono text-[11px] text-[#00ff9d] overflow-x-auto my-2">${codeBlockContent.join('\n')}</pre>`);
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

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      if (!inList) {
        inList = true;
        htmlLines.push('<ul class="list-disc pl-4 my-2.5 space-y-1 text-[#8b9bb4] text-xs">');
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

    if (line.startsWith('# ')) {
      htmlLines.push(`<h1 class="text-base font-bold text-white mt-4 mb-2 border-b border-[#1c2b3a] pb-1">${parseInlineMarkdown(line.slice(2))}</h1>`);
    } else if (line.startsWith('## ')) {
      htmlLines.push(`<h2 class="text-sm font-bold text-[#f0f0f0] mt-3.5 mb-1.5 border-b border-[#1c2b3a]/50 pb-1">${parseInlineMarkdown(line.slice(3))}</h2>`);
    } else if (line.startsWith('### ')) {
      htmlLines.push(`<h3 class="text-xs font-bold text-white mt-3 mb-1">${parseInlineMarkdown(line.slice(4))}</h3>`);
    } else if (line.trim() === '') {
      htmlLines.push('<p class="h-1.5"></p>');
    } else {
      htmlLines.push(`<p class="text-[#8b9bb4] text-xs leading-relaxed my-1">${parseInlineMarkdown(line)}</p>`);
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
};

const parseTagInput = (tags: string): string[] => {
  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
};

interface DocumentManagerProps {
  pin: string;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({ pin }) => {
  const [notes, setNotes] = useLocalStorage<DocumentNote[]>('my-monitor-notes', [], pin);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Editor states
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [saveState, setSaveState] = useState<'saved' | 'pending'>('saved');

  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const handleSelectNote = (note: DocumentNote) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setSaveState('saved');
  };

  useEffect(() => {
    if (!activeNoteId) return;

    setSaveState('pending');
    const timeout = window.setTimeout(() => {
      const parsedTags = parseTagInput(editTags);
      setNotes(currentNotes => currentNotes.map(note => {
        if (note.id === activeNoteId) {
          return {
            ...note,
            title: editTitle.trim() || 'UNTITLED NOTE',
            content: editContent,
            tags: parsedTags,
            updatedAt: new Date().toISOString()
          };
        }
        return note;
      }));
      setSaveState('saved');
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [activeNoteId, editTitle, editContent, editTags, setNotes]);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagsSet.add(tag.trim().toLowerCase()));
    });
    return Array.from(tagsSet).filter(Boolean);
  }, [notes]);

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

  const handleNewNote = () => {
    const newNote: DocumentNote = {
      id: crypto.randomUUID(),
      title: 'UNTITLED NOTE',
      content: '# UNTITLED NOTE\n\nWrite content here...\n\n- Routine checklist details\n- Tech specifications',
      tags: ['doc'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes([newNote, ...notes]);
    handleSelectNote(newNote);
  };

  const handleSaveNote = () => {
    if (!activeNoteId) return;
    const parsedTags = parseTagInput(editTags);
    setNotes(currentNotes => currentNotes.map(note => {
      if (note.id === activeNoteId) {
        return {
          ...note,
          title: editTitle.trim() || 'UNTITLED NOTE',
          content: editContent,
          tags: parsedTags,
          updatedAt: new Date().toISOString()
        };
      }
      return note;
    }));
    setSaveState('saved');
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setNotes(notes.filter(n => n.id !== id));
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
    <div className="h-[calc(100vh-140px)] flex flex-col md:h-[680px]">
      {/* If activeNote is open, show editor. Otherwise, show Master catalogue */}
      {activeNote ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0b1623]">
          {/* Header Panel */}
          <div className="p-3 border border-[#1c2b3a] flex items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => {
                handleSaveNote();
                setActiveNoteId(null);
              }}
              className="text-[#8b9bb4] hover:text-[#ff9f30] p-1.5 hover:bg-[#1c2b3a] flex items-center gap-1 text-[9px] font-bold"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>CATALOG</span>
            </button>

            <div className="flex bg-[#1c2b3a]/50 p-0.5 border border-[#1c2b3a]">
              <button
                onClick={() => setEditorMode('edit')}
                className={`px-3 py-1.5 text-[9px] font-bold flex items-center space-x-1 transition-all ${
                  editorMode === 'edit' ? 'bg-[#ff9f30] text-[#0b1623]' : 'text-[#8b9bb4] hover:text-white'
                }`}
              >
                <Edit className="w-3 h-3" />
                <span>WRITE</span>
              </button>
              <button
                onClick={() => setEditorMode('preview')}
                className={`px-3 py-1.5 text-[9px] font-bold flex items-center space-x-1 transition-all ${
                  editorMode === 'preview' ? 'bg-[#ff9f30] text-[#0b1623]' : 'text-[#8b9bb4] hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>PREVIEW</span>
              </button>
            </div>

            <div className="flex items-center space-x-1.5">
              <span className={`hidden sm:inline text-[8px] font-bold uppercase tracking-wider px-1.5 py-1 border ${
                saveState === 'saved'
                  ? 'text-[#00ff9d] border-[#00ff9d]/25 bg-[#00ff9d]/10'
                  : 'text-[#ff9f30] border-[#ff9f30]/25 bg-[#ff9f30]/10'
              }`}>
                {saveState === 'saved' ? 'SAVED' : 'SAVING'}
              </span>
              <button
                onClick={() => handleDeleteNote(activeNote.id)}
                className="text-[#8b9bb4] hover:text-rose-500 p-1.5 hover:bg-[#1c2b3a]"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSaveNote}
                className="bg-[#00ff9d] hover:bg-[#00e58c] text-[#0b1623] font-bold px-3 py-1.5 text-[9px] tracking-wide"
              >
                SAVE
              </button>
            </div>
          </div>

          {/* Details header */}
          <div className="px-4 py-3 border-x border-b border-[#1c2b3a] bg-[#1c2b3a]/10 space-y-2 shrink-0">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value.toUpperCase());
              }}
              onBlur={handleSaveNote}
              placeholder="DOCUMENT TITLE"
              className="w-full bg-transparent font-extrabold text-white text-xs border-none focus:outline-none focus:ring-0 p-0 placeholder-slate-600 uppercase"
            />
            <div className="flex items-center space-x-1.5">
              <Tag className="w-3 h-3 text-[#ff9f30]" />
              <input
                type="text"
                value={editTags}
                onChange={(e) => {
                  setEditTags(e.target.value);
                }}
                onBlur={handleSaveNote}
                placeholder="tags, separated, by, commas"
                className="flex-1 bg-transparent border-none text-[10px] text-[#8b9bb4] focus:outline-none focus:ring-0 p-0 placeholder-slate-600 lowercase"
              />
            </div>
          </div>

          {/* Workspace Area */}
          <div className="flex-1 border-x border-b border-[#1c2b3a] flex overflow-hidden bg-[#0b1623]">
            {editorMode === 'edit' ? (
              <textarea
                value={editContent}
                onChange={(e) => {
                  setEditContent(e.target.value);
                }}
                onBlur={handleSaveNote}
                placeholder="Write markdown details here... Use # for title, ## for subtitles, - for list items, **bold**, *italic*, `code` and [text](link)"
                className="flex-1 h-full p-4 text-[11px] font-mono text-[#f0f0f0] bg-[#0b1623] border-none outline-none focus:outline-none focus:ring-0 resize-none overflow-y-auto leading-relaxed"
              />
            ) : (
              <div
                className="flex-1 h-full p-4 overflow-y-auto text-xs leading-relaxed text-[#8b9bb4]"
                dangerouslySetInnerHTML={{ __html: renderedPreview }}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col gap-3.5 h-full overflow-hidden">
          {/* Top Panel catalog filters */}
          <div className="bg-[#0b1623] border border-[#1c2b3a] p-3.5 space-y-3.5">
            <div className="flex justify-between items-center">
              <h2 className="text-[10px] font-bold text-[#f0f0f0] tracking-wider flex items-center gap-1.5 uppercase">
                KNOWLEDGE BASE <BookOpen className="w-4 h-4 text-[#ff9f30]" />
              </h2>
              <button
                onClick={handleNewNote}
                className="flex items-center space-x-1 bg-[#ff9f30] text-[#0b1623] hover:bg-[#ff9f30]/90 px-2.5 py-1.5 font-bold text-[9px] tracking-wide"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NEW DOC</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8b9bb4] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH GUIDES, NOTES..."
                className="w-full bg-[#0b1623] text-[#f0f0f0] pl-8.5 pr-3 py-2 border border-[#1c2b3a] focus:outline-none focus:border-[#ff9f30] text-[10px]"
              />
            </div>

            {/* Tag selector */}
            {allTags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[8px] font-bold text-[#8b9bb4] tracking-wider block">FILTER BY TAG</span>
                <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                  <button
                    onClick={() => setSelectedTag(null)}
                    className={`text-[8px] font-bold px-2 py-0.5 border transition-all ${
                      selectedTag === null
                        ? 'bg-[#ff9f30] text-[#0b1623] border-[#ff9f30]'
                        : 'bg-transparent border-[#1c2b3a] text-[#8b9bb4] hover:bg-[#1c2b3a]'
                    }`}
                  >
                    ALL
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`text-[8px] font-bold px-2 py-0.5 border transition-all flex items-center gap-0.5 ${
                        selectedTag === tag
                          ? 'bg-[#ff9f30] text-[#0b1623] border-[#ff9f30]'
                          : 'bg-transparent border-[#1c2b3a] text-[#8b9bb4] hover:bg-[#1c2b3a]'
                      }`}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{tag.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes Catalogue Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {filteredNotes.length === 0 ? (
              <div className="bg-[#0b1623] border border-[#1c2b3a] p-8 text-center">
                <FileText className="w-8 h-8 text-[#1c2b3a] mx-auto mb-1.5" />
                <p className="text-[#8b9bb4] text-[10px]">NO DOCUMENTS REGISTERED IN DATABASE.</p>
              </div>
            ) : (
              filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-3.5 border transition-all flex items-start justify-between group ${
                    activeNoteId === note.id
                      ? 'bg-[#1c2b3a]/30 border-[#ff9f30]'
                      : 'bg-[#0b1623] border-[#1c2b3a] hover:border-[#8b9bb4]'
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className="font-bold text-[#f0f0f0] text-xs truncate leading-snug group-hover:text-[#ff9f30] transition-colors uppercase">
                      {note.title}
                    </h4>
                    <p className="text-[#8b9bb4] text-[8px] block">
                      UPDATED: {new Date(note.updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }).toUpperCase()}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {note.tags.map(t => (
                        <span key={t} className="text-[8px] font-bold text-[#ff9f30] bg-[#1c2b3a]/40 border border-[#ff9f30]/20 px-1 rounded-none lowercase">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#1c2b3a] group-hover:text-[#ff9f30] transition-colors shrink-0 mt-0.5" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default DocumentManager;
