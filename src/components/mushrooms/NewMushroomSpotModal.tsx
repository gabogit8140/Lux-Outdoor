import React, { useState } from 'react';
import { X, Check, MapPin, Sparkles } from 'lucide-react';
import { COMMON_MUSHROOM_VARIETIES } from '../../types/mushroom';

interface NewMushroomSpotModalProps {
  isOpen: boolean;
  coordinate: [number, number] | null;
  onClose: () => void;
  onSave: (name: string, variety: string, coordinates: [number, number], notes?: string) => void;
}

export function NewMushroomSpotModal({
  isOpen,
  coordinate,
  onClose,
  onSave,
}: NewMushroomSpotModalProps) {
  const [name, setName] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('Cèpes & Bolets');
  const [notes, setNotes] = useState('');

  if (!isOpen || !coordinate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(name || `Coin à ${selectedVariety}`, selectedVariety, coordinate, notes);
    setName('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-3 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-amber-200 dark:border-amber-900/60 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-stone-100 dark:border-slate-800 bg-amber-500/10 dark:bg-amber-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl shadow-2xs">
              🍄
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Nouveau coin à champignons
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-600" />
                {coordinate[0].toFixed(5)}°N, {coordinate[1].toFixed(5)}°E
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
              Nom du spot :
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cèpes du vallon moussus, Sous les hêtres..."
              className="w-full text-xs p-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
              Variété trouvée :
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {COMMON_MUSHROOM_VARIETIES.map((v) => {
                const isSelected = selectedVariety === v.label;
                return (
                  <button
                    key={v.label}
                    type="button"
                    onClick={() => setSelectedVariety(v.label)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30 shadow-xs'
                        : 'bg-stone-50 dark:bg-slate-800/80 border-stone-200 dark:border-slate-700 text-stone-700 dark:text-slate-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>{v.emoji}</span>
                    <span className="truncate">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1">
              Observations de terrain :
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Pente bien exposée, terre humide sous les feuillus, à vérifier 4 jours après la pluie..."
              rows={2}
              className="w-full text-xs p-2.5 bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enregistrer le coin 🍄</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
