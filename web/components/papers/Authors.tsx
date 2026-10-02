import { team } from '@/lib/data';
import { labRoster, markLabMembers } from '@/lib/papers';
import AuthorMarks from './AuthorMarks';

const roster = labRoster(team.people);

/** Server-side author marking for a display author string (see AuthorMarks). */
export default function Authors({ authors }: { authors: string }) {
  return <AuthorMarks segments={markLabMembers(authors, roster)} />;
}

/** The legend shown once per list. */
export function LabMarkKey({ className }: { className?: string }) {
  return (
    <span className={`lab-mark-key label ${className ?? ''}`}>
      <span className="lab-mark" aria-hidden="true" />
      ARCS Lab member
    </span>
  );
}
