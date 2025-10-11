"use client";

interface BulletEditorProps {
  bullets: string[];
  onUpdate: (bullets: string[]) => void;
  highlighted?: Set<string>;
}

export function BulletEditor({ bullets, onUpdate, highlighted }: BulletEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Experience bullets</h3>
        <button
          type="button"
          className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
          onClick={() => onUpdate([...bullets, ""])}
        >
          + Add bullet
        </button>
      </div>
      <div className="space-y-2">
        {bullets.map((bullet, index) => {
          const isHighlighted = highlighted?.has(bullet);
          return (
            <textarea
              key={`bullet-${index}`}
              value={bullet}
              rows={3}
              onChange={(event) => {
                const next = [...bullets];
                next[index] = event.target.value;
                onUpdate(next);
              }}
              className={`w-full rounded-md border p-2 text-sm focus:border-sky-500 focus:outline-none ${
                isHighlighted ? "border-sky-400 bg-sky-50" : "border-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
