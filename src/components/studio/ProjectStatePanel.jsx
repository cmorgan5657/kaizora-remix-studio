import { useState, useEffect, useRef } from 'react';
import { History } from 'lucide-react';
import ReferencePanel from '@/components/studio/ReferencePanel';

const STORAGE_KEY = 'kaizora_prompt_history';
const MAX_HISTORY = 20;

export default function ProjectStatePanel({ styleLocks, envLocks, lightingLocks, references, onReferencesChange, externalPrompt, onExternalPromptChange }) {
  const activeLocks = [styleLocks, envLocks, lightingLocks].filter((l) => l.some((i) => i.isActive)).length;
  const [history, setHistory] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch {}
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveToHistory = () => {
    const text = (externalPrompt || '').trim();
    if (!text) return;
    setHistory((prev) => {
      const next = [text, ...prev.filter((p) => p !== text)].slice(0, MAX_HISTORY);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSelect = (text) => { onExternalPromptChange?.(text); setDropdownOpen(false); };
  const handleClear = () => { setHistory([]); localStorage.removeItem(STORAGE_KEY); };

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="px-4 py-3 border-b border-border">
        <span className="panel-title">Project State</span>
        <div className="text-xs text-muted-foreground mt-1">{activeLocks} of 3 active locks</div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col">
        <div>
          <span className="panel-title">Reference Assets</span>
          <div className="mt-2">
            <ReferencePanel references={references || []} onChange={onReferencesChange} />
          </div>
        </div>

        <div className="mt-4 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between">
            <span className="panel-title">Prompt</span>
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors" title="Prompt history">
                <History className="w-3 h-3" /> History
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-[210px] bg-popover border border-border rounded-md shadow-lg z-50 max-h-[280px] overflow-y-auto scrollbar-thin">
                  {history.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-muted-foreground">No saved prompts yet</div>
                  ) : (
                    <>
                      {history.map((p, i) => (
                        <button key={i} onClick={() => handleSelect(p)} className="w-full text-left px-3 py-2 text-xs text-secondary-foreground hover:bg-card-raised transition-colors border-b border-border last:border-b-0">
                          <span className="line-clamp-2">{p}</span>
                        </button>
                      ))}
                      <button onClick={handleClear} className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors">Clear history</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex-1 flex flex-col min-h-0">
            <textarea
              value={externalPrompt || ''}
              onChange={(e) => onExternalPromptChange?.(e.target.value)}
              onBlur={saveToHistory}
              placeholder="Enter or paste your custom prompt here…"
              className="w-full flex-1 bg-card border border-border rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none min-h-[220px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}