import { cn } from '@/lib/utils';
import Image from 'next/image';

function getAvatarInitial(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'A';
  return trimmed.charAt(0).toUpperCase();
}

export default function UserAvatar({
  name,
  imageUrl,
  className,
  textClassName,
}: {
  name: string;
  imageUrl?: string | null;
  className: string;
  textClassName: string;
}) {
  if (imageUrl) {
    return (
      <div
        className={cn('relative overflow-hidden rounded-md bg-muted shadow-sm shrink-0', className)}
      >
        <Image src={imageUrl} alt={name} fill sizes="36px" className="object-cover m-0" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shrink-0',
        className,
      )}
    >
      <span className={cn('font-semibold', textClassName)}>{getAvatarInitial(name)}</span>
    </div>
  );
}
