import { Lightbulb } from "lucide-react";

interface ChefNotesProps {
  notes?: string | null;
}

export default function ChefNotes({ notes }: ChefNotesProps) {
  if (!notes) return null;

  // Split notes by newlines or bullet points to create a list
  // Support multiple formats: newlines, bullets (•), asterisks (*), hyphens (-)
  const notesList = notes
    .split(/\n|•|\*(?!\w)|-(?=\s)/)
    .map((note) => note.trim())
    .filter((note) => note.length > 0);

  // If there's only one note and it's long, don't split it into a list
  if (notesList.length === 1 && notesList[0].length > 100) {
    return (
      <div className="bg-amber-50 rounded-lg shadow-md p-6 border border-amber-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="text-amber-600" size={24} />
          Chef&apos;s Tips & Notes
        </h3>
        <p className="text-gray-700">{notesList[0]}</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 rounded-lg shadow-md p-6 border border-amber-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Lightbulb className="text-amber-600" size={24} />
        Chef&apos;s Tips & Notes
      </h3>
      <ul className="space-y-3">
        {notesList.map((note, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-amber-600 mt-1 flex-shrink-0">•</span>
            <span className="text-gray-700">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
