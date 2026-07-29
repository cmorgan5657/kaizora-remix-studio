import { Film, Clock } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Timeline({ shots, onReorder, onSelectShot, selectedShotId }) {
  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const reordered = [...shots];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, orderIndex: i }));
    onReorder(updated);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-border">
        <span className="panel-title">Timeline</span>
        <div className="text-xs text-muted-foreground mt-1">{shots.length} shot{shots.length !== 1 ? 's' : ''} · drag to reorder</div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="timeline" direction="horizontal">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex-1 flex items-center gap-3 overflow-x-auto scrollbar-thin p-6">
              {shots.length === 0 ? (
                <div className="flex flex-col items-center gap-2 w-full text-center">
                  <Film className="w-12 h-12 text-muted-foreground" />
                  <div className="text-sm text-secondary-foreground">No shots yet</div>
                  <div className="text-xs text-muted-foreground">Generate shots in the Studio to build your sequence.</div>
                </div>
              ) : (
                shots.map((shot, index) => (
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