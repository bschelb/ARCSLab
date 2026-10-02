import type { AuthorSegment } from '@/lib/papers';

/**
 * Renders precomputed author segments with the lab mark after every ARCS Lab member, PI
 * included (group framing). Has no data imports, so client components can use it too.
 */
export default function AuthorMarks({ segments }: { segments: AuthorSegment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
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
