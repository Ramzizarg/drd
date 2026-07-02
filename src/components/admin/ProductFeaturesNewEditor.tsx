"use client";

import { useState, useEffect } from "react";

interface FeatureRow {
  title: string;
  description: string;
  imageFile?: File | null;
  previewUrl?: string;
}

export function ProductFeaturesNewEditor() {
  const [mounted, setMounted] = useState(false);
  const [rows, setRows] = useState<FeatureRow[]>([{ 
    title: "", 
    description: "",
    imageFile: null,
    previewUrl: ''
  }]);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      rows.forEach(row => {
        if (row.previewUrl && row.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(row.previewUrl);
        }
      });
    };
  }, [rows]);
  
  // Validate image file
  const validateImageFile = (file: File): boolean => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Veuillez sélectionner une image au format JPG, PNG, WebP ou GIF.");
      return false;
    }

    if (file.size > maxSize) {
      alert("La taille de l'image ne doit pas dépasser 5 Mo.");
      return false;
    }

    return true;
  };

  const handleTitleChange = (index: number, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, title: value } : row)));
  };

  const handleDescriptionChange = (index: number, value: string) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, description: value } : row)));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!validateImageFile(file)) {
      e.target.value = ''; // Reset the input
      return;
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Clean up previous preview URL if it exists
    const prevRow = rows[index];
    if (prevRow?.previewUrl && prevRow.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(prevRow.previewUrl);
    }
    
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              imageFile: file,
              previewUrl,
            }
          : row
      )
    );
  };

  const handleAdd = () => {
    setRows((prev) => [...prev, { 
      title: "", 
      description: "",
      imageFile: null,
      previewUrl: ''
    }]);
  };

  const handleRemove = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 md:flex-row md:items-start md:gap-4"
        >
          <div className="w-full md:w-1/3 space-y-1">
            <label className="text-[11px] font-medium text-zinc-700">
              Image de la caractéristique {!row.previewUrl && <span className="text-red-500">*</span>}
            </label>

            {/* Real file input: always rendered so the file is submitted */}
            <input
              id={`featureNewImage_${index}`}
              type="file"
              name={`featureNewImage_${index}`}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e, index)}
            />

            {row.previewUrl ? (
              <div className="relative h-32 w-32 rounded-3xl border border-zinc-200 bg-white shadow-sm flex items-center justify-center">
                <label
                  htmlFor={`featureNewImage_${index}`}
                  className="h-24 w-24 overflow-hidden rounded-2xl bg-zinc-50 cursor-pointer"
                >
                  <img
                    src={row.previewUrl}
                    alt={`Prévisualisation ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // Clean up the URL object
                    if (row.previewUrl && row.previewUrl.startsWith('blob:')) {
                      URL.revokeObjectURL(row.previewUrl);
                    }
                    setRows(prev => 
                      prev.map((r, i) => 
                        i === index 
                          ? { ...r, previewUrl: '', imageFile: null }
                          : r
                      )
                    );
                  }}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-semibold text-white shadow-md hover:bg-red-600"
                  aria-label="Retirer l'image"
                >
                  ×
                </button>
              </div>
            ) : (
              <label
                htmlFor={`featureNewImage_${index}`}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-red-200 bg-red-50/60 px-3 py-2 text-[10px] text-red-700 hover:bg-red-100 hover:border-red-300"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[12px] font-bold text-white">+</span>
                <span className="flex flex-col">
                  <span className="font-semibold">Ajouter une image</span>
                  <span className="text-[9px] text-red-500/80">JPG, PNG, WebP, GIF (max 5MB)</span>
                </span>
              </label>
            )}

            <input type="hidden" name="featureImageUrls" value={row.previewUrl || ''} />
          </div>

          <div className="flex-1 space-y-2">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-700">
                Titre de la caractéristique {index + 1}
              </label>
              <input
                type="text"
                name="featureTitles"
                value={row.title}
                onChange={(e) => handleTitleChange(index, e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-zinc-900"
                placeholder={`Caractéristique ${index + 1}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-700">
                Paragraphe de la caractéristique {index + 1}
              </label>
              <textarea
                name="featureDescriptions"
                value={row.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-xs outline-none focus:border-zinc-900"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-between items-center pt-1 md:pt-6">
            <div className="min-h-4 text-xs text-red-500">
              {mounted && !row.previewUrl ? "Une image est requise" : null}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-[11px] text-red-600 hover:text-red-700"
            >
              Supprimer
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center pt-1">
        <p className="text-[11px] text-zinc-500">
          Vous pouvez ajouter plusieurs caractéristiques. Elles seront affichées dans l'ordre de la liste.
        </p>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={rows.length >= 5} // Limit to 5 features
        >
          + Ajouter une caractéristique {rows.length > 0 && `(${rows.length}/5)`}
        </button>
      </div>
    </div>
  );
}
