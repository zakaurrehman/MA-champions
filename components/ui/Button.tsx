import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-display uppercase tracking-wide transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none';

const variants: Record<Variant, string> = {
  // Oxblood carries the action. The gold sheen still travels across it on
  // hover, so the material cue survives without gold doing the shouting.
  primary: 'bg-primary text-on-primary hover:bg-primary-hover plate-sheen',
  secondary: 'border border-subtle/40 text-ink hover:border-primary hover:text-link',
  ghost: 'text-muted hover:text-link',
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
