import { useState } from 'react';
import { Film, Clock, Plus, Layers, Trash2, Hash, Lock, Pencil } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Timeline({ shots, sequences, activeSequenceId, onSelectSequence, onCreateSequence, onRenameSequence, onDeleteSequence, onReorder, onSelectShot, selectedShotId }) {
  const [editingSeqId, setEditingSeqId] = useState(null);
  const [editName, setEditName] = useState('');

  const activeSequence = sequences?.find((s) => s.id === activeSequenceId);
  const sequenceShots = shots.filter((s) => s.sequenceId === activeSequenceId);

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...sequenceShots];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, orderIndex: i }));
    onReorder(updated);
  };

  const startEdit = () => {
    if (!activeSequence) return;
    setEditingSeqId(activeSequence.id);
    setEditName(activeSequence.name);
  };

  const commitEdit = () => {
    if (editingSeqId && editName.trim()) {
      onRenameSequence?.(editingSeqId, editName.trim());
    }
    setEditingSeqId(null);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <Layers className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        {editingSeqId ? (
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') setEditingSeqId(null);
            }}
            autoFocus
            className="bg-card border border-border-active rounded px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <>
            <select
              value={activeSequenceId || ''}
              onChange={(e) => onSelectSequence?.(e.target.value)}
              className="bg-card border border-border rounded px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            >
              {sequences?.map((seq) => (
                <option key={seq.id} value={seq.id}>{seq.name}</option>
              ))}
            </select>
            <button onClick={startEdit} className="p-1 text-muted-foreground hover:text-accent transition-colors" title="Rename sequence">
              <Pencil className="w-3 h-3" />
            </button>
          </>
        )}
        {activeSequence?.sequenceSeed != null && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Hash className="w-3 h-3" />
            {activeSequence.sequenceSeed}
            {activeSequence.seedLocked && <Lock className="w-2.5 h-2.5" />}
          </span>
        )}
        <div className="flex-1" />
        {sequences && sequences.length > 1 && (
          <button onClick={() => onDeleteSequence?.(activeSequenceId)} className="p-1 text-muted-foreground hover:text-destructive transition-colors" title="Delete sequence">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={() => onCreateSequence?.()} className="px-2 py-1 text-xs font-medium text-accent-foreground bg-accent rounded hover:bg-accent-hover transition-colors flex items-center gap-1">
          <Plus className="w-3 h-3" /> New Sequence
        </button>
      </div>

      <div className="px-6 py-2 border-b border-border">
        <span className="panel-title">{sequenceShots.length} shot{sequenceShots.length !== 1 ? 's' : ''} · drag to reorder</span>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-thin p-6">
              {sequenceShots.length === 0 ? (
                <div className="flex flex-col items-center gap-2 w-full text-center">
                  <Film className="w-12 h-12 text-muted-foreground" />
                  <div className="text-sm text-secondary-foreground">No shots in this sequence</div>
                  <div className="text-xs text-muted-foreground">Generate shots in the Studio to build your sequence.</div>
                </div>
              ) : (
                sequenceShots.map((shot, index) => (
                  <Draggable key={shot.id} draggableId={shot.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => onSelectShot?.(shot.id)}
                        className={`flex-shrink-0 w-40 rounded-md border bg-card p-3 cursor-pointer transition-colors ${selectedShotId === shot.id ? 'border-accent' : 'border-border hover:border-border-active'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-xs font-medium text-muted-foreground tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                          {shot.status === 'complete' && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                          {shot.status === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />}
                          {shot.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                        </div>
                        <div className="w-full h-12 rounded bg-card-raised flex items-center justify-center mb-2">
                          <Film className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-xs text-foreground truncate">{shot.name || `Shot ${index + 1}`}</div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" />
                          {shot.duration || 5}s · {shot.qualityTier || 'Draft'}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}