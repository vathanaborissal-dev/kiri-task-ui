import { Fragment } from 'react';

/**
 * Renders the one piece of markup the changelog and guide use: `**bold**`.
 * Deliberately not a markdown parser — this text is written by us, in code.
 */
export function Emphasis({ children }: { children: string }) {
  return (
    <>
      {children.split(/\*\*(.+?)\*\*/g).map((part, index) =>
        index % 2 === 1 ? (
          <strong key={index} className="font-medium text-foreground">
            {part}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
