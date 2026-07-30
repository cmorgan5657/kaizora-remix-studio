import { useState, useRef, useEffect } from 'react';
import { Clapperboard, Send, Loader2, Film, Zap, Wand2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import DirectorMessage from './DirectorMessage';

const QUICK_ACTIONS = [
  { id: 'auto-build', label: 'Auto-Build', icon: Sparkles },
  { id: 'quick-build', label: 'Quick Build', icon: Zap },
  { id: 'prompt', label: 'Refine prompt', icon: Wand2 },
  { id: 'shots', label: 'Suggest shots', icon: Film },
  { id: 'continuity', label: 'Check continuity', icon: ShieldCheck },
];

export default function DirectorPanel({ project, characters, shots, sequences, styleLocks, envLocks, lightingLocks, selectedShot, references, onCreateShots, onApplyIntent, onAutoBuild, onQuickBuild, onClose }) {
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
      let fileUrls = null;

      if (action === 'auto-build') {
        const refImageUrls = (references || []).filter((r) => r.type === 'image').map((r) => r.url);
        prompt = `You are a professional AI film director and production designer for Kaizora Remix Studio. The creator has given you a script${refImageUrls.length > 0 ? ' and reference images (attached as files)' : ''}. Build out the ENTIRE production:\n\n1. CHARACTERS: Identify every character. For each provide name, role (one of: Lead, Supporting, Background, Narrator), and a full identityStatement with age, gender presentation, height, build, skin tone, hair color, hair length, and eye color.${refImageUrls.length > 0 ? ' Use the reference images as the visual source of truth for appearance.' : ''}\n2. STYLE LOCK: Define the visual style — name, colorGrade, filmStock, lens.\n3. ENVIRONMENT LOCK: Define the primary setting — name, description, interiorExterior (interior or exterior), scale.\n4. LIGHTING LOCK: Define the lighting — name, mood, timeOfDay, keyDirection (N/S/E/W/NW/NE/SW/SE/Top/Bottom).\n5. SEQUENCES & SHOTS: Break the script into sequences (scenes), each containing shots. For each shot: name, intentText (what happens), shotType, cameraMove, duration (2-10s).\n\nShot types: Extreme Wide, Wide, Full, Medium Wide, Medium, Medium Close, Close Up, Extreme Close Up, Over the Shoulder, POV, Two Shot, Insert\nCamera moves: Static, Dolly In, Dolly Out, Truck Left, Truck Right, Pedestal Up, Pedestal Down, Pan Left, Pan Right, Tilt Up, Tilt Down, Orbit Left, Orbit Right, Crane Up, Crane Down, Push In, Pull Out, Handheld Follow, Steadicam Follow, Zoom In, Zoom Out\n\nScript:\n${text}`;
        schema = { type: 'object', properties: { title: { type: 'string' }, summary: { type: 'string' }, characters: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, identityStatement: { type: 'string' }, ageRange: { type: 'number' }, genderPresentation: { type: 'string' }, height: { type: 'string' }, build: { type: 'string' }, skinTone: { type: 'string' }, hairColor: { type: 'string' }, hairLength: { type: 'string' }, eyeColor: { type: 'string' } } } }, styleLock: { type: 'object', properties: { name: { type: 'string' }, colorGrade: { type: 'string' }, filmStock: { type: 'string' }, lens: { type: 'string' } } }, environmentLock: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, interiorExterior: { type: 'string' }, scale: { type: 'string' } } }, lightingLock: { type: 'object', properties: { name: { type: 'string' }, mood: { type: 'string' }, timeOfDay: { type: 'string' }, keyDirection: { type: 'string' } } }, sequences: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, shots: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, intentText: { type: 'string' }, shotType: { type: 'string' }, cameraMove: { type: 'string' }, duration: { type: 'number' } } } } } } } } };
        fileUrls = refImageUrls.length > 0 ? refImageUrls : null;
      } else if (action === 'quick-build') {
        const refUrls = (references || []).filter((r) => r.type === 'image').map((r) => r.url);
        prompt = `You are a professional AI film director for Kaizora Remix Studio. Break this script into shots that total exactly 30 seconds. Each shot MUST be 4, 6, or 8 seconds (the only supported durations). Distribute shots to total 30 seconds exactly (e.g., five 6-second shots, or three 8-second + one 6-second).${refUrls.length > 0 ? ' Use the attached reference images as the visual source of truth for style, appearance, and setting.' : ''} For each shot provide:\n- name: Short descriptive name\n- intentText: Cinematic description of what happens (character action, camera movement, mood) — 1-2 sentences\n- shotType: One of: Extreme Wide, Wide, Full, Medium Wide, Medium, Medium Close, Close Up, Extreme Close Up, Over the Shoulder, POV, Two Shot, Insert\n- cameraMove: One of: Static, Dolly In, Dolly Out, Truck Left, Truck Right, Pedestal Up, Pedestal Down, Pan Left, Pan Right, Tilt Up, Tilt Down, Orbit Left, Orbit Right, Crane Up, Crane Down, Push In, Pull Out, Handheld Follow, Steadicam Follow, Zoom In, Zoom Out\n- duration: 4, 6, or 8 (must sum to 30)\n\nScript:\n${text}`;
        schema = { type: 'object', properties: { summary: { type: 'string' }, shots: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, intentText: { type: 'string' }, shotType: { type: 'string' }, cameraMove: { type: 'string' }, duration: { type: 'number' } } } } } };
        fileUrls = refUrls.length > 0 ? refUrls : null;
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
        file_urls: fileUrls,
      });

      let assistantMsg;
      if (schema && response) {
        if (response.characters || response.sequences) {
          assistantMsg = { role: 'assistant', content: response.summary || `Here's your production plan.`, autoBuildPlan: response };
        } else if (response.shots && action === 'quick-build') {
          onQuickBuild(response.shots);
          assistantMsg = { role: 'assistant', content: `🎬 Quick Build started — generating ${response.shots.length} shots (30 seconds total) using your script${(references || []).length > 0 ? ' and reference assets' : ''}. Watch them appear in your timeline as they complete.` };
        } else if (response.shots) {
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

  const handleAutoBuildClick = async (plan) => {
    await onAutoBuild(plan);
    setMessages((prev) => prev.map((m) => m.autoBuildPlan === plan ? { ...m, built: true } : m));
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
          <button key={a.id} onClick={() => { setActiveAction(a.id); setInput(''); }} className={`flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded transition-colors whitespace-nowrap flex-shrink-0 ${activeAction === a.id ? 'bg-accent text-accent-foreground' : 'bg-card border border-border text-secondary-foreground hover:border-border-active'}`}>
            <a.icon className="w-2.5 h-2.5" /> {a.label}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-3 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <Clapperboard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm text-secondary-foreground mb-1">Your AI Director</div>
            <div className="text-xs text-muted-foreground leading-relaxed">Use Quick Build to generate 30s of video from a script, or Auto-Build for full production. Ask for prompt help, suggest shots, or check continuity.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <DirectorMessage key={i} message={msg} hasSelectedShot={!!selectedShot} onCreateShots={handleCreateShots} onApplyIntent={handleApplyIntent} onAutoBuild={handleAutoBuildClick} />
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
              {activeAction === 'auto-build' && '🎬 Paste your full script — the AI will build everything'}
              {activeAction === 'quick-build' && '⚡ Paste your script — AI will generate 30s of video using your references'}
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
            placeholder={activeAction === 'auto-build' ? 'Paste your full script here...' : activeAction === 'quick-build' ? 'Paste your script here...' : activeAction === 'continuity' ? 'Any specific concerns? (optional)' : 'Ask the director anything...'}
            className="flex-1 bg-card border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring resize-none scrollbar-thin"
            rows={activeAction === 'quick-build' || activeAction === 'auto-build' ? 5 : 2}
          />
          <button onClick={handleSend} disabled={!input.trim() || loading} className="p-2 text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}