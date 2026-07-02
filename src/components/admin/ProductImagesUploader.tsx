"use client";

import { useState, useRef, ChangeEvent, MouseEvent, useId, useEffect } from "react";

interface ExistingImage {
  id: number;
  url: string;
  isPrimary: boolean;
}

interface ProductImagesUploaderProps {
  fieldName?: string;
  existingImages?: ExistingImage[];
}

const MAX_FILES = 8;
const MAX_SIZE = 5 * 1024 * 1024;

export function ProductImagesUploader({
  fieldName = "files",
  existingImages = [],
}: ProductImagesUploaderProps) {
  const inputId = useId();
  const [existingItems, setExistingItems] = useState<ExistingImage[]>(existingImages);
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [primaryExistingId, setPrimaryExistingId] = useState<number | null>(
    existingImages.find((img) => img.isPrimary)?.id ?? existingImages[0]?.id ?? null
  );
  const [primaryNewIndex, setPrimaryNewIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeExistingCount = existingItems.length;
  const totalCount = activeExistingCount + files.length;
  const canAddMore = totalCount < MAX_FILES;

  const syncInputFiles = (nextFiles: File[]) => {
    if (!inputRef.current) return;
    const dataTransfer = new DataTransfer();
    nextFiles.forEach((file) => dataTransfer.items.add(file));
    inputRef.current.files = dataTransfer.files;
  };

  useEffect(() => {
    syncInputFiles(files);
  }, [files]);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const form = input.closest("form");
    if (!form) return;

    const syncBeforeSubmit = () => {
      if (files.length > 0) {
        syncInputFiles(files);
      }
    };

    form.addEventListener("submit", syncBeforeSubmit, true);
    return () => form.removeEventListener("submit", syncBeforeSubmit, true);
  }, [files]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;

    const slotsLeft = MAX_FILES - activeExistingCount - files.length;
    if (slotsLeft <= 0) {
      alert(`Maximum ${MAX_FILES} images autorisées par produit.`);
      e.target.value = "";
      return;
    }

    const incoming: File[] = [];
    for (const file of Array.from(selected)) {
      if (file.size > MAX_SIZE) {
        alert(`L'image "${file.name}" dépasse 5 Mo et a été ignorée.`);
        continue;
      }
      incoming.push(file);
      if (incoming.length >= slotsLeft) {
        if (Array.from(selected).length > slotsLeft) {
          alert(`Maximum ${MAX_FILES} images autorisées par produit.`);
        }
        break;
      }
    }

    if (incoming.length === 0) {
      e.target.value = "";
      return;
    }

    const nextFiles = [...files, ...incoming];
    const nextPreviews = [...previews, ...incoming.map((file) => URL.createObjectURL(file))];

    setFiles(nextFiles);
    setPreviews(nextPreviews);
    syncInputFiles(nextFiles);

    if (nextFiles.length > 0 && primaryNewIndex < 0 && activeExistingCount === 0) {
      setPrimaryNewIndex(0);
    }

    e.target.value = "";
  };

  const handleRemoveNew = (index: number, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const previewUrl = previews[index];
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextFiles = files.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);

    setFiles(nextFiles);
    setPreviews(nextPreviews);
    syncInputFiles(nextFiles);

    if (primaryNewIndex === index) {
      setPrimaryNewIndex(-1);
    } else if (primaryNewIndex > index) {
      setPrimaryNewIndex((prev) => prev - 1);
    }
  };

  const handleRemoveExisting = (e: MouseEvent<HTMLButtonElement>, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    setExistingItems((prev) => prev.filter((img) => img.id !== id));
    setRemovedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    if (primaryExistingId === id) {
      const remaining = existingItems.filter((img) => img.id !== id);
      setPrimaryExistingId(remaining[0]?.id ?? null);
      setPrimaryNewIndex(-1);
    }
  };

  const selectExistingPrimary = (id: number) => {
    setPrimaryExistingId(id);
    setPrimaryNewIndex(-1);
  };

  const selectNewPrimary = (index: number) => {
    setPrimaryNewIndex(index);
    setPrimaryExistingId(null);
  };

  const hasImages = existingItems.length > 0 || previews.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          id={inputId}
          name={fieldName}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          ref={inputRef}
          onChange={handleChange}
          disabled={!canAddMore}
        />
        <label
          htmlFor={inputId}
          className={`inline-flex cursor-pointer items-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow ${
            canAddMore
              ? "bg-zinc-900 hover:bg-zinc-800"
              : "cursor-not-allowed bg-zinc-400"
          }`}
        >
          Ajouter des images
        </label>
        <span className="text-[11px] text-zinc-500">
          {totalCount}/{MAX_FILES}
        </span>
        <input
          type="hidden"
          name="primaryIndex"
          value={primaryNewIndex >= 0 ? primaryNewIndex : -1}
        />
      </div>

      {hasImages && (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-500">
            Cliquez sur une image pour la définir comme principale. Les anciennes images sont conservées
            quand vous en ajoutez de nouvelles.
          </p>
          <div className="flex flex-wrap gap-3">
            {existingItems.map((img) => (
              <div key={`existing-${img.id}`} className="relative group">
                <div
                  onClick={() => selectExistingPrimary(img.id)}
                  className={`relative h-16 w-16 overflow-hidden rounded-xl border cursor-pointer ${
                    primaryExistingId === img.id && primaryNewIndex < 0
                      ? "border-[#ff1744] ring-2 ring-[#ff1744]"
                      : "border-zinc-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Image actuelle"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleRemoveExisting(e, img.id)}
                    className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600/80 text-[9px] text-white hover:bg-red-700"
                  >
                    ×
                  </button>
                  {primaryExistingId === img.id && primaryNewIndex < 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] font-semibold text-white px-1 py-0.5 text-center">
                      Principale
                    </span>
                  )}
                </div>
              </div>
            ))}

            {previews.map((src, index) => (
              <div
                key={`new-${src}-${index}`}
                onClick={() => selectNewPrimary(index)}
                className={`relative h-16 w-16 overflow-hidden rounded-xl border cursor-pointer ${
                  primaryNewIndex === index
                    ? "border-[#ff1744] ring-2 ring-[#ff1744]"
                    : "border-zinc-200"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Nouvelle image ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => handleRemoveNew(index, e)}
                  className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600/80 text-[9px] text-white hover:bg-red-700"
                >
                  ×
                </button>
                {primaryNewIndex === index && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] font-semibold text-white px-1 py-0.5 text-center">
                    Principale
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {primaryExistingId !== null && primaryNewIndex < 0 && (
        <input type="hidden" name="primaryExistingId" value={primaryExistingId} />
      )}
      {removedIds.map((id) => (
        <input key={id} type="hidden" name="removeImageIds" value={id} />
      ))}
    </div>
  );
}
