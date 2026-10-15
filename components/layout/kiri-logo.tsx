import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * The Kiri mark, in colour in both modes.
 *
 * Dark mode used to swap to a flat white silhouette, which threw the brand away
 * at night. It gets a recoloured variant instead: the darker of the two brand
 * blues sits at 2.7:1 on a dark surface, under the 3:1 floor for a graphic, so
 * both tones are lifted while keeping their relationship.
 */
export function KiriLogo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  const base = showWordmark ? '/logo/logo_with_text' : '/logo/logo_without_text';
  const sizes = showWordmark ? '160px' : '32px';
  const fit = showWordmark ? 'object-cover object-center' : 'scale-110 object-contain';

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative block shrink-0 overflow-hidden',
          showWordmark ? 'h-10 w-40' : 'size-8',
        )}
      >
        <Image
          src={`${base}_color.png`}
          alt={showWordmark ? 'Kiri Task' : ''}
          fill
          sizes={sizes}
          className={cn(fit, 'dark:hidden')}
        />
        <Image
          src={`${base}_color_dark.png`}
          alt=""
          fill
          sizes={sizes}
          className={cn(fit, 'hidden dark:block')}
        />
      </span>
    </span>
  );
}
