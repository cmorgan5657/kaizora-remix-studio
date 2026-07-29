import { useState, useRef, useEffect } from 'react';
import { Clapperboard, Send, Loader2, Film, FileText, Wand2, ShieldCheck, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DirectorMessage from './DirectorMessage';

const QUICK_ACTIONS = [
  { id: 'script', label: 'Break down script', icon: FileText },
  { id: 'prompt', label: 'Refine prompt', icon: Wand2 },
  { id: 'shots', label: 'Suggest shots', icon: Film },
  { id: 'continuity', label: 'Check continuity', icon: ShieldCheck },
];

export default function DirectorPanel({ project, characters, shots, sequences, styleLocks, envLocks, lightingLocks, selectedShot, onCreateShots, onApplyIntent, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const buildContext = () => {
    const activeChar = characters?.find((c) => c.isActive);
    const activeStyle = styleLocks?.find((l) => l.isActive);
    const activeEnv = envLocks?.find((l) => l.isActive);
    const activeLight = lightingLocks?.find((l) => l.isActive);

    let ctx = `You are a professional AI film director assistant for Kaizora Remix Studio. You help creators with script breakdown, shot planning, prompt writing, and continuity. Be concise, specific, and actionable.\n\n`;
    ctx += `PROJECT CONTEXT:\n`;
    ctx += `- Name: ${project?.name}\n`;
    ctx += `- Aspect Ratio: ${project?.aspectRatio}\n`;
    if (activeChar) ctx += `- Active Character: ${activeChar.name} (${activeChar.tier} tier) — ${activeChar.identityStatement || 'No identity statement'}\n`;
    if (activeStyle) ctx += `- Style Lock: ${activeStyle.name}\n`;
    if (activeEnv) ctx += `- Environment Lock: ${activeEnv.name}\n`;
    if (activeLight) ctx += `- Lighting: ${activeLight.mood}, ${activeLight.timeOfDay}\n`;
    ctx += `- Total Shots: ${shots?.length || 0}\n`;
    if (selectedShot) ctx += `- Selected Shot: "${selectedShot.name}" — Intent: "${selectedShot.intentText || 'None'}"\n`;
    return ctx;
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const action = activeAction;
    setMessages((prev) => [...prev, { role: 'user', content: text, action }]);
    setInput('');
    setActiveAction(null);
    setLoading(true);

    try {
      const context = buildContext();
      let prompt = text;
      let schema = null;

      if (action === 'script') {
        prompt = `Break down this script into individual shots for AI video production. For each shot provide:\n- name: Short descriptive name\n- intentText: What happens in the shot (character action, camera movement, mood)\n- shotType: One of: Extreme Wide, Wide, Full, Medium Wide, Medium, Medium Close, Close Up, Extreme Close Up, Over the Shoulder, POV, Two Shot, Insert\n- cameraMove: One of: Static, Dolly In, Dolly Out, Truck Left, Truck Right, Pedestal Up, Pedestal Down, Pan Left, Pan Right, Tilt Up, Tilt Down, Orbit Left, Orbit Right, Crane Up, Crane Down, Push In, Pull Out, Handheld Follow, Steadicam Follow, Zoom In, Zoom Out\n- duration: Duration in seconds (2-10)\n\nScript:\n${text}`;
        schema = { type: 'object', properties: { summary: { type: 'string' }, shots: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, intentText: { type: 'string' }, shotType: { type: 'string' }, cameraMove: { type: 'string' }, duration: { type: 'number' } } } } } };
      } else if (action === 'prompt') {
        prompt = `The creator wants help refining a prompt for their current shot. Based on the project context and their request, write a clear, cinematic intentText that describes what happens in the shot — include character action, camera movement, and mood. Keep it under 2 sentences.\n\nCreator's request: ${text}`;
        schema = { type: 'object', properties: { intentText: { type: 'string' }, notes: { type: 'string' } } };
      } else if (action === 'shots') {
        prompt = `Based on the project context, suggest a sequence of 3-5 shots that would work well. For each shot provide name, intentText, shotType, cameraMove, and duration.\n\nCreator's request: ${text}`;
        schema = { type: 'object', properties: { summary: { type: 'string' }, shots: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, intentText: { type: 'string' }, shotType: { type: 'string' }, cameraMove: { type: 'string' }, duration: { type: 'number' } } } } } };
      } else if (action === 'continuity') {
        const shotList = shots?.map((s, i) => `${i + 1}. ${s.name}: ${s.intentText || 'No intent'} (${s.shotType || '?'}, ${s.cameraMove || '?'})`).join('\n') || 'No shots yet';
        prompt = `Review these shots for continuity issues (wardrobe changes, lighting mismatches, character position jumps, eyeline mismatches, screen direction violations). List any issues found with specific recommendations.\n\nShots:\n${shotList}\n\nCreator's note: ${text || 'Please review.'}`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${context}\n\n${prompt}`,
        response_json_schema: schema,
      });

      let assistantMsg;
      if (schema && response) {
        if (response.shots) {
          assistantMsg = { role: 'assistant', content: response.summary || `Here are ${response.shots.length} shots I suggest.`, shotSuggestions: response.shots };
        } else if (response.intentText) {
          assistantMsg = { role: 'assistant', content: response.notes || "Here's a refined prompt:", promptSuggestion: response.intentText };
        } else {
          assistantMsg = { role: 'assistant', content: typeof response === 'string' ? response : JSON.stringify(response) };
        }
      } else {
        assistantMsg = { role: 'assistant', content: typeof response === 'string' ? response : JSON.stringify(response) };
      }

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, I ran into an error: ${e.message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShots = async (shotSuggestions) => {
    await onCreateShots(shotSuggestions);
    setMessages((prev) => [...prev, { role: 'assistant', content: `✓ Created ${shotSuggestions.length} shots. Find them in your Timeline and Shots panel — select one to start generating.` }]);
  };

  const handleApplyIntent = (intentText) => {
    onApplyIntent(intentText);
    setMessages((prev) => [...prev, { role: 'assistant', content: `✓ Applied the prompt to "${selectedShot?.name || 'the selected shot'}". Switch to the INTENT tab to review and generate.` }]);
  };

  return (
    <div className="h-full flex flex-col bg-panel">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-foreground">AI Director</span>
        </div>
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border flex-shrink-0 overflow-x-auto scrollbar-thin">
        {QUICK_ACTIONS.map((a) => (
          <button key={a.id} onClick={() => { setActiveAction(a.id); setInput(''); }} className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors whitespace-nowrap flex-shrink-0 ${activeAction === a.id ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-secondary-foreground hover:border-border-active'}`}>
            <a.icon className="w-3 h-3" /> {a.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <Clapperboard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm text-secondary-foreground mb-1">Your AI Director</div>
            <div className="text-xs text-muted-foreground leading-relaxed">Paste a script to break into shots, ask for prompt help, suggest a shot sequence, or check continuity across your project.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <DirectorMessage key={i} message={msg} hasSelectedShot={!!selectedShot} onCreateShots={handleCreateShots} onApplyIntent={handleApplyIntent} />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Director is thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border p-3 flex-shrink-0">
        {activeAction && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-accent">
              {activeAction === 'script' && '📋 Paste your script below'}
              {activeAction === 'prompt' && '✨ Describe what you want to see'}
              {activeAction === 'shots' && '🎬 Describe the scene or story beat'}
              {activeAction === 'continuity' && '🔍 Add any notes (optional)'}
            </span>
            <button onClick={() => setActiveAction(null)} className="text-xs text-muted-foreground hover:text-foreground">cancel</button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={activeAction === 'script' ? 'Paste script here...' : activeAction === 'continuity' ? 'Any specific concerns? (optional)' : 'Ask the director anything...'}
            className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none scrollbar-thin"
            rows={activeAction === 'script' ? 5 : 2}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading} className="p-2 text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}