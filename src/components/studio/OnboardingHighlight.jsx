import { useState, useEffect } from 'react';

const STEPS = {
  character_needed: { selector: '[data-onboarding="add-character"]', label: 'Start here. Define your character once and it stays consistent across every shot.' },
  intent_needed: null,
  generate_needed: { selector: '[data-onboarding="generate-btn"]', label: 'Draft mode costs 1 credit.' },
};

const HIGHLIGHT_CLASSES = ['ring-2', 'ring-accent', 'ring-offset-2', 'ring-offset-background', 'animate-pulse', 'rounded-md'];

export default function OnboardingHighlight({ step }) {
  const [rect, setRect] = useState(null);
  const config = STEPS[step];

  useEffect(() => {
    if (!config) { setRect(null); return; }
    let el = null;
    let interval = null;
    const tryFind = () => {
      el = document.querySelector(config.selector);
      if (!el) return false;
      el.classList.add(...HIGHLIGHT_CLASSES);
      const update = () => setRect(el.getBoundingClientRect());
      update();
      interval = setInterval(update, 500);
      return true;
    };
    const found = tryFind();
    if (!found) {
      const retry = setInterval(() => { if (tryFind()) clearInterval(retry); }, 300);
      const timeout = setTimeout(() => clearInterval(retry), 5000);
      return () => { clearInterval(retry); clearTimeout(timeout); if (el) el.classList.remove(...HIGHLIGHT_CLASSES); clearInterval(interval); };
    }
    return () => { if (el) el.classList.remove(...HIGHLIGHT_CLASSES); clearInterval(interval); };
  }, [step, config]);

  if (!config || !rect) return null;
  const above = rect.top < 120;
  return (
    <div className="fixed z-[150] pointer-events-none" style={{ top: above ? rect.bottom + 8 : undefined, bottom: above ? undefined : window.innerHeight - rect.top + 8, left: Math.max(8, Math.min(rect.left, window.innerWidth - 308)), maxWidth: 300 }}>
      <div className={`bg-accent text-accent-foreground text-xs font-medium px-3 py-2 rounded-md shadow-lg ${above ? '' : 'mb-1'}`}>
        {config.label}
      </div>
      {!above && <div className="w-2 h-2 bg-accent rotate-45 mx-auto -mt-1" />}
    </div>
  );
}