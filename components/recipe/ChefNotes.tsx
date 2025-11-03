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
      <div className="bg-accent-light dark:bg-accent-light/10 rounded-lg shadow-md p-6 border border-accent/20 dark:border-accent/30">
        <h3 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
          <Lightbulb className="text-accent" size={24} />
          Chef&apos;s Tips & Notes
        </h3>
        <p className="text-text">{notesList[0]}</p>
      </div>
    );
  }

  return (
    <div className="bg-accent-light dark:bg-accent-light/10 rounded-lg shadow-md p-6 border border-accent/20 dark:border-accent/30">
      <h3 className="text-xl font-bold text-text mb-4 flex items-center gap-2">
        <Lightbulb className="text-accent" size={24} />
        Chef&apos;s Tips & Notes
      </h3>
      <ul className="space-y-3">
        {notesList.map((note, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-accent mt-1 flex-shrink-0">•</span>
            <span className="text-text">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
