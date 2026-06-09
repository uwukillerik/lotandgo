"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImageUploader({
  files,
  onChange,
  max = 5,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const list = Array.from(incoming).filter((f) => f.type.startsWith("image/"));
      const merged = [...files, ...list].slice(0, max);
      onChange(merged);
    },
    [files, max, onChange],
  );

  const previews = files.map((f) => URL.createObjectURL(f));

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 transition",
          dragging
            ? "border-amber-500 bg-amber-50"
            : "border-slate-200 bg-slate-50/80 hover:border-amber-400 hover:bg-amber-50/50",
        )}
      >
        <Upload className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">Нажмите или перетащите фото</p>
        <p className="mt-1 text-xs text-slate-500">До {max} изображений, JPEG/PNG/WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />
      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((file, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200">
              <Image src={previews[i]} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
