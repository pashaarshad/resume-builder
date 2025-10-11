"use client";

interface TemplateSelectorProps {
  template: string;
  onChange: (template: string) => void;
}

const TEMPLATES = [
  { id: "classic", label: "Classic" },
  { id: "compact", label: "Compact" },
  { id: "modern", label: "Modern" }
];

export function TemplateSelector({ template, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-slate-700">Template</p>
      <div className="flex gap-2">
        {TEMPLATES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
              template === item.id ? "border-sky-500 bg-sky-100 text-sky-700" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
