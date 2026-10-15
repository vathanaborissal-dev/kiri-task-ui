import { cn } from '@/lib/utils';

const URL_RE = /(https?:\/\/[^\s<]+)/g;
const MENTION_RE = /(@[\w.-]+)/g;
const KEY_RE = /\b([A-Z][A-Z0-9]{1,9}-(?:I|HF)?\d+)\b/g;

/**
 * Renders user-authored text safely: no HTML is interpreted, but links, task
 * keys and @mentions are picked out so comments read naturally.
 */
export function RichText({
  children,
  className,
  clamp,
}: {
  children: string | null | undefined;
  className?: string;
  clamp?: number;
}) {
  if (!children) return null;

  const paragraphs = children.split(/\n{2,}/);

  return (
    <div
      className={cn(
        'space-y-2 text-sm leading-relaxed break-anywhere whitespace-pre-wrap',
        clamp ? `line-clamp-${clamp}` : '',
        className,
      )}
    >
      {paragraphs.map((paragraph, index) => (
        <p key={index}>{decorate(paragraph)}</p>
      ))}
    </div>
  );
}

const decorate = (text: string): React.ReactNode[] =>
  text
    .split(URL_RE)
    .flatMap((chunk, chunkIndex) => {
      if (URL_RE.test(chunk)) {
        return [
          <a
            key={`u-${chunkIndex}`}
            href={chunk}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:no-underline"
          >
            {chunk}
          </a>,
        ];
      }
      return chunk.split(MENTION_RE).flatMap((part, partIndex) => {
        if (MENTION_RE.test(part)) {
          return [
            <span
              key={`m-${chunkIndex}-${partIndex}`}
              className="rounded bg-primary/10 px-1 font-medium text-primary"
            >
              {part}
            </span>,
          ];
        }
        return part.split(KEY_RE).map((segment, segIndex) =>
          KEY_RE.test(segment) ? (
            <span key={`k-${chunkIndex}-${partIndex}-${segIndex}`} className="font-mono text-xs">
              {segment}
            </span>
          ) : (
            segment
          ),
        );
      });
    });
