import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  // The one gold-filled element on any given view. Used sparingly.
  primary: 'bg-plated text-ink hover:brightness-110 plate-sheen',
  secondary: 'border border-nickel/40 text-bone hover:border-gold hover:text-gold-hi',
  ghost: 'text-bone-dim hover:text-gold-hi',
};

const sizes: Record<Size, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonAsLink = CommonProps & { href: string } & Omit<
    ComponentProps<typeof Link>,
    'href' | 'className' | 'children'
  >;

type ButtonAsButton = CommonProps & { href?: never } & Omit<
    ComponentProps<'button'>,
    'className' | 'children'
  >;

export default function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest as { href: string } & ComponentProps<'a'>;
    // Outbound links (WhatsApp, mailto) open in a new tab; internal ones prefetch.
    const external = href.startsWith('http') || href.startsWith('mailto:');

    if (external) {
      return (
        <a href={href} className={cls} target="_blank" rel="noopener noreferrer" {...anchorProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...(rest as ComponentProps<'button'>)}>
      {children}
    </button>
  );
}
