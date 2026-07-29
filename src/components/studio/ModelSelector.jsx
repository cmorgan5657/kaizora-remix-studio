import { Film, Image as ImageIcon, Video, Type, Mic, Volume2, Music, Check } from 'lucide-react';

const MODES = [
  { id: 'text2video', label: 'Text → Video', desc: 'Generate video from text', icon: Film, needsRef: false },
  { id: 'image2video', label: 'Image → Video', desc: 'Animate an image', icon: ImageIcon, needsRef: true },
  { id: 'video2video', label: 'Video → Video', desc: 'Transform a video', icon: Video, needsRef: true },
  { id: 'text2image', label: 'Text → Image', desc: 'Generate images from text', icon: Type, needsRef: false },
  { id: 'image2image', label: 'Image → Image', desc: 'Transform an image', icon: ImageIcon, needsRef: true },
  { id: 'text2audio', label: 'Text → Audio', desc: 'Generate speech', icon: Mic, needsRef: false },
  { id: 'audio2audio', label: 'Audio → Audio', desc: 'Voice conversion', icon: Volume2, needsRef: true },
  { id: 'text2music', label: 'Text → Music', desc: 'Generate music', icon: Music, needsRef: false },
];

const MODELS = {
  text2video: [
    { id: 'veo3', name: 'Google Veo 3', provider: 'Google', badge: 'Best Quality' },
    { id: 'sora', name: 'OpenAI Sora', provider: 'OpenAI', badge: 'New' },
    { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', provider: 'Runway' },
    { id: 'luma-dream', name: 'Luma Dream Machine', provider: 'Luma Labs' },
    { id: 'kling', name: 'Kling AI', provider: 'Kuaishou' },
    { id: 'pika', name: 'Pika Labs', provider: 'Pika' },
    { id: 'haiper', name: 'Haiper AI', provider: 'Haiper' },
  ],
  image2video: [
    { id: 'veo3', name: 'Google Veo 3', provider: 'Google', badge: 'Best Quality' },
    { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', provider: 'Runway' },
    { id: 'luma-dream', name: 'Luma Dream Machine', provider: 'Luma Labs' },
    { id: 'kling', name: 'Kling AI', provider: 'Kuaishou' },
    { id: 'pika', name: 'Pika Labs', provider: 'Pika' },
    { id: 'stable-video', name: 'Stable Video Diffusion', provider: 'Stability AI' },
  ],
  video2video: [
    { id: 'runway-gen3', name: 'Runway Gen-3 Alpha', provider: 'Runway' },
    { id: 'luma-dream', name: 'Luma Dream Machine', provider: 'Luma Labs' },
    { id: 'kling', name: 'Kling AI', provider: 'Kuaishou' },
    { id: 'pika', name: 'Pika Labs', provider: 'Pika' },
  ],
  text2image: [
    { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Midjourney', badge: 'Best Quality' },
    { id: 'flux-pro', name: 'FLUX.1 Pro', provider: 'Black Forest Labs' },
    { id: 'dalle3', name: 'DALL-E 3', provider: 'OpenAI' },
    { id: 'sdxl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
    { id: 'ideogram', name: 'Ideogram v2', provider: 'Ideogram', badge: 'Best Text' },
    { id: 'firefly', name: 'Adobe Firefly', provider: 'Adobe' },
  ],
  image2image: [
    { id: 'midjourney-v6', name: 'Midjourney v6', provider: 'Midjourney' },
    { id: 'flux-pro', name: 'FLUX.1 Pro', provider: 'Black Forest Labs' },
    { id: 'sdxl', name: 'Stable Diffusion XL', provider: 'Stability AI' },
    { id: 'dalle3', name: 'DALL-E 3', provider: 'OpenAI' },
    { id: 'ideogram', name: 'Ideogram v2', provider: 'Ideogram' },
  ],
  text2audio: [
    { id: 'elevenlabs', name: 'ElevenLabs', provider: 'ElevenLabs', badge: 'Best Voice' },
    { id: 'openai-tts', name: 'OpenAI TTS', provider: 'OpenAI' },
    { id: 'playht', name: 'Play.ht', provider: 'Play.ht' },
  ],
  audio2audio: [
    { id: 'elevenlabs-vc', name: 'ElevenLabs Voice Conversion', provider: 'ElevenLabs' },
    { id: 'rvc', name: 'RVC v2', provider: 'RVC Project' },
  ],
  text2music: [
    { id: 'suno', name: 'Suno v4', provider: 'Suno', badge: 'Best Music' },
    { id: 'udio', name: 'Udio', provider: 'Udio' },
    { id: 'musicgen', name: 'MusicGen', provider: 'Meta' },
    { id: 'stable-audio', name: 'Stable Audio', provider: 'Stability AI' },
  ],
};

export default function ModelSelector({ mode, model, onModeChange, onModelChange, hasReferences }) {
  const availableModels = MODELS[mode] || [];
  const currentModelExists = availableModels.some((m) => m.id === model);

  const handleModeChange = (newMode) => {
    onModeChange(newMode);
    const newModels = MODELS[newMode] || [];
    if (!newModels.some((m) => m.id === model) && newModels.length > 0) {
      onModelChange(newModels[0].id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground">Select your generation mode and model. Modes that require a reference are disabled until you upload one in the REFERENCE tab.</div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">Generation mode</div>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const disabled = m.needsRef && !hasReferences;
            return (
              <button
                key={m.id}
                onClick={() => !disabled && handleModeChange(m.id)}
                disabled={disabled}
                className={`flex items-center gap-2 p-2 rounded-md border transition-colors text-left ${mode === m.id ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-border-active'} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <m.icon className="w-4 h-4 text-secondary-foreground flex-shrink-0" />
                <div>
                  <div className="text-xs font-medium text-foreground">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs text-muted-foreground mb-2">Model</div>
        <div className="space-y-1.5">
          {availableModels.map((m) => (
            <button
              key={m.id}
              onClick={() => onModelChange(m.id)}
              className={`flex items-center justify-between w-full p-2.5 rounded-md border transition-colors text-left ${model === m.id ? 'border-accent bg-accent/10' : 'border-border bg-card hover:border-border-active'}`}
            >
              <div>
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                <div className="text-[10px] text-muted-foreground">{m.provider}</div>
              </div>
              <div className="flex items-center gap-2">
                {m.badge && <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent/20 text-accent">{m.badge}</span>}
                {model === m.id && <Check className="w-4 h-4 text-accent" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}