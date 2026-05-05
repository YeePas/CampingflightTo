'use client';

import { Tip, TIP_CATEGORIES } from '@/lib/types';
import { useState } from 'react';
import { PencilIcon } from './Icons';

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
  'Bergen': '⛰️',
  'Algemeen': '💡',
};

const EMPTY_FORM = { title: '', content: '', category: 'Algemeen', imageUrl: '' };

export default function TipsView({ tips, onAdd, onDelete, onEdit }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('Alle');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const categories = ['Alle', ...TIP_CATEGORIES];
  const filtered = activeCategory === 'Alle' ? tips : tips.filter(t => t.category === activeCategory);

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    const data = {
      title: form.title,
      content: form.content,
      category: form.category,
      imageUrl: form.imageUrl || undefined,
    };
    if (editingTip) {
      onEdit({ ...editingTip, ...data });
    } else {
      onAdd(data);
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingTip(null);
  };

  const startEdit = (tip: Tip) => {
    setEditingTip(tip);
    setForm({
      title: tip.title,
      content: tip.content,
      category: tip.category,
      imageUrl: tip.imageUrl ?? '',
    });
    setShowForm(true);
  };

  const catIndex = categories.indexOf(activeCategory);

  return (
    <div>
      {/* Category filter — sliding segmented control */}
      <div className="relative mb-4 overflow-x-auto scrollbar-hide">
        <div className="flex bg-stone-200/60 rounded-xl p-1 w-max min-w-full">
          {/* Sliding pill */}
          <div
            className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-200 ease-out pointer-events-none"
            style={{
              left:  `calc(${catIndex} * (100% / ${categories.length}) + 0.25rem)`,
              width: `calc(100% / ${categories.length} - 0.5rem)`,
            }}
          />
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`relative flex-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                activeCategory === cat ? 'text-stone-800' : 'text-stone-500'
              }`}
            >
              {cat !== 'Alle' && CATEGORY_EMOJI[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tips list */}
      <div className="space-y-3 mb-4">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-stone-400">
            <div className="text-3xl mb-2">💡</div>
            <p>Nog geen tips in deze categorie.</p>
          </div>
        )}
        {filtered.map(tip => {
          const isOpen = expandedId === tip.id;
          return (
            <div key={tip.id} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-stone-50 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : tip.id)}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex-shrink-0">{CATEGORY_EMOJI[tip.category] || '💡'}</span>
                  <span className="font-semibold text-stone-700 truncate min-w-0">{tip.title}</span>
                </div>
                <span className="text-stone-400 text-sm flex-shrink-0 ml-2">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="border-t border-stone-100 px-4 py-3">
                  {tip.category === 'Knopen' && tip.knotIcon && (
                    <a
                      href={`https://knots3d.com/en/${tip.knotIcon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 mb-3 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100"
                    >
                      <span>🪢</span> Bekijk 3D-animatie op knots3d.com
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
                    </a>
                  )}
                  {tip.imageUrl && (
                    <img
                      src={tip.imageUrl}
                      alt={tip.title}
                      className="w-full rounded-xl mb-3 max-h-64 object-cover"
                      loading="lazy"
                    />
                  )}
                  <pre className="text-sm text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">{tip.content}</pre>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => startEdit(tip)}
                      className="text-xs text-stone-500 hover:text-stone-700 font-medium flex items-center gap-1"
                    >
                      <PencilIcon className="w-3.5 h-3.5" /> Bewerken
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
          );
        })}
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditingTip(null); setForm(EMPTY_FORM); }}
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
          <input
            type="url"
            placeholder="Foto-URL (optioneel)"
            value={form.imageUrl}
            onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
