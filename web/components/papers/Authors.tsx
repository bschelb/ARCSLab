import { team } from '@/lib/data';
import { labRoster, markLabMembers } from '@/lib/papers';

const roster = labRoster(team.people);

/**
 * An author string with every ARCS Lab member marked the same way, PI included
 * (group framing). The mark is a small orange dot with an accessible label.
 */
export default function Authors({ authors }: { authors: string }) {
  return (
    <>
      {markLabMembers(authors, roster).map((seg, i) =>
        seg.isLabMember ? (
          <span key={i}>
            {seg.text}
            <span className="lab-mark" title="ARCS Lab member">
              <span className="sr-only"> (ARCS Lab member)</span>
            </span>
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
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
