import { X } from 'lucide-react';
import StyleLockEditor from './locks/StyleLockEditor';
import EnvironmentLockEditor from './locks/EnvironmentLockEditor';
import LightingLockEditor from './locks/LightingLockEditor';

const TITLES = { StyleLock: 'Style Lock', EnvironmentLock: 'Environment Lock', LightingLock: 'Lighting Lock' };

export default function LockEditorDialog({ lockType, lock, onClose, onUpdate }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-panel border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{TITLES[lockType]}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {lockType === 'StyleLock' && <StyleLockEditor lock={lock} onUpdate={onUpdate} />}
          {lockType === 'EnvironmentLock' && <EnvironmentLockEditor lock={lock} onUpdate={onUpdate} />}
          {lockType === 'LightingLock' && <LightingLockEditor lock={lock} onUpdate={onUpdate} />}
        </div>
      </div>
    </div>
  );
}