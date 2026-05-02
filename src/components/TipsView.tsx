'use client';

import { Tip, TIP_CATEGORIES } from '@/lib/types';
import { useState } from 'react';

interface Props {
  tips: Tip[];
  onAdd: (tip: Omit<Tip, 'id'>) => void;
  onDelete: (id: string) => void;
  onEdit: (tip: Tip) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  'Knopen': '🪢',
  'Koken': '🍳',
  'Veiligheid': '⚠️',
  'Kinderen': '🧒',
  'Bergen': '⛰️',
  'Algemeen': '💡',
};

export default function TipsView({ tips, onAdd, onDelete, onEdit }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('Alle');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'Algemeen' });

  const categories = ['Alle', ...TIP_CATEGORIES];
  const filtered = activeCategory === 'Alle' ? tips : tips.filter(t => t.category === activeCategory);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingTip) {
      onEdit({ ...editingTip, ...form });
    } else {
      onAdd(form);
    }
    setForm({ title: '', content: '', category: 'Algemeen' });
    setShowForm(false);
    setEditingTip(null);
  };

  const startEdit = (tip: Tip) => {
    setEditingTip(tip);
    setForm({ title: tip.title, content: tip.content, category: tip.category });
    setShowForm(true);
  };

  return (
    <div>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat
                ? 'bg-green-600 text-white'
                : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {cat !== 'Alle' && CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {/* Tips list */}
      <div className="space-y-3 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <div className="text-3xl mb-2">💡</div>
            <p>Nog geen tips in deze categorie.</p>
          </div>
        )}
        {filtered.map(tip => (
          <div key={tip.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
              onClick={() => setExpandedId(expandedId === tip.id ? null : tip.id)}
            >
              <div className="flex items-center gap-2">
                <span>{CATEGORY_EMOJI[tip.category] || '💡'}</span>
                <span className="font-semibold text-stone-700">{tip.title}</span>
                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">{tip.category}</span>
              </div>
              <span className="text-stone-400 text-sm">{expandedId === tip.id ? '▲' : '▼'}</span>
            </button>

            {expandedId === tip.id && (
              <div className="border-t border-stone-100 px-4 py-3">
                <pre className="text-sm text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">{tip.content}</pre>
                <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => startEdit(tip)}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    ✏️ Bewerken
                  </button>
                  <button
                    onClick={() => onDelete(tip.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    🗑️ Verwijderen
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingTip(null); setForm({ title: '', content: '', category: 'Algemeen' }); }}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-300 text-stone-500 hover:border-green-400 hover:text-green-600 transition-colors text-sm font-medium"
        >
          + Tip of knoop toevoegen
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 space-y-3">
          <h3 className="font-semibold text-stone-700">{editingTip ? 'Tip bewerken' : 'Nieuwe tip'}</h3>
          <input
            type="text"
            placeholder="Titel (bijv. Paalsteek)"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <select
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          >
            {TIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea
            placeholder="Inhoud, uitleg, stappen..."
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            rows={5}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700"
            >
              {editingTip ? 'Opslaan' : 'Toevoegen'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingTip(null); }}
              className="flex-1 bg-stone-100 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-stone-200"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
