import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Wallet, Plus, Minus } from 'lucide-react';

const TYPE_LABELS = {
  generation: 'Generation',
  regeneration: 'Regeneration',
  training: 'Training',
  postprocess: 'Post-processing',
  refund: 'Refund',
};

export default function CreditDashboard({ projectId, project, onClose, onUpdateBudget }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState(project?.budgetCredits || '');

  useEffect(() => {
    base44.entities.CreditTransaction.filter({ projectId })
      .then((txns) => {
        setTransactions(txns.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const usageByType = transactions.reduce((acc, t) => {
    const type = t.type || 'generation';
    if (!acc[type]) acc[type] = { spent: 0, refunded: 0 };
    if (t.amount < 0) acc[type].spent += Math.abs(t.amount);
    else acc[type].refunded += t.amount;
    return acc;
  }, {});

  const totalSpent = Object.values(usageByType).reduce((sum, u) => sum + u.spent, 0);
  const totalRefunded = Object.values(usageByType).reduce((sum, u) => sum + u.refunded, 0);
  const netSpent = totalSpent - totalRefunded;

  const balance = project?.creditBalance ?? 0;
  const budget = project?.budgetCredits;
  const budgetUsed = budget ? Math.round((netSpent / budget) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col bg-panel border border-border rounded-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2"><Wallet className="w-4 h-4" /> Credits</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-md bg-card border border-border">
              <div className="text-xs text-muted-foreground">Current balance</div>
              <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">{balance}</div>
            </div>
            <div className="p-3 rounded-md bg-card border border-border">
              <div className="text-xs text-muted-foreground">Total spent</div>
              <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">{netSpent}</div>
            </div>
          </div>

          <div className="p-3 rounded-md bg-card border border-border space-y-2">
            <div className="text-xs text-muted-foreground">Credit budget</div>
            {budget ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground tabular-nums">{netSpent} / {budget}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{budgetUsed}%</span>
                </div>
                <div className="h-2 rounded-full bg-card-raised overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${budgetUsed > 90 ? 'bg-destructive' : budgetUsed > 70 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(100, budgetUsed)}%` }} />
                </div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">No budget set. Set one to track spending.</div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="Set budget" className="flex-1 bg-card-raised border border-border rounded-md px-2 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={() => onUpdateBudget(Number(budgetInput) || 0)} className="px-3 py-1 text-xs font-medium text-accent-foreground bg-accent rounded-md hover:bg-accent-hover transition-colors">Save</button>
            </div>
          </div>

          {Object.keys(usageByType).length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Usage by type</div>
              <div className="space-y-1.5">
                {Object.entries(usageByType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between p-2 rounded bg-card border border-border">
                    <span className="text-sm text-foreground">{TYPE_LABELS[type] || type}</span>
                    <div className="flex items-center gap-3 text-xs">
                      {data.spent > 0 && <span className="text-destructive tabular-nums flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" />{data.spent}</span>}
                      {data.refunded > 0 && <span className="text-success tabular-nums flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" />{data.refunded}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-2">Recent transactions</div>
            {loading ? (
              <div className="text-xs text-muted-foreground">Loading…</div>
            ) : transactions.length === 0 ? (
              <div className="text-xs text-muted-foreground">No transactions yet. Generate a shot to see activity.</div>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 15).map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded bg-card border border-border">
                    <div>
                      <div className="text-sm text-foreground">{TYPE_LABELS[t.type] || t.type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(t.created_date).toLocaleString()}</div>
                    </div>
                    <span className={`text-sm font-medium tabular-nums ${t.amount < 0 ? 'text-destructive' : 'text-success'}`}>{t.amount < 0 ? '' : '+'}{t.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}