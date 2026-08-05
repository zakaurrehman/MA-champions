import { socialLinks } from '@/lib/site';
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  YouTubeIcon,
} from '@/components/ui/Icons';

const ICONS = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  tiktok: TikTokIcon,
  youtube: YouTubeIcon,
} as const;

/**
 * Social icon row. Renders nothing when no profiles are configured, so the
 * footer never shows an empty "Follow us" heading with no links under it.
 */
export default function SocialLinks() {
  const links = socialLinks();
  if (links.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 font-body text-2xs font-semibold uppercase tracking-[0.2em] text-subtle">
        Follow
      </h2>
      <ul className="flex items-center gap-2">
        {links.map(({ id, label, href }) => {
          const Icon = ICONS[id];
          return (
            <li key={id}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`M.A Champions Belts on ${label}`}
                className="grid h-10 w-10 place-items-center rounded-[--radius-plate] border border-subtle/25 text-ink transition-colors hover:border-primary hover:text-link"
              >
                <Icon className="h-4.5 w-4.5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
