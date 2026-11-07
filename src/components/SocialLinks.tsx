import { business } from "@/data/menu";
import { socialIconPaths } from "./social-icons";

/**
 * Links to McRelish's own social profiles. Rendered as icon buttons with
 * accessible labels so screen readers announce the platform name.
 */
export function SocialLinks({
  className = "",
  linkClassName = "inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/15 text-cream/70 transition-colors duration-200 hover:border-primary hover:text-primary",
  iconClassName = "h-[18px] w-[18px]",
}: {
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  return (
    <ul className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {business.socials.map((social) => (
        <li key={social.id}>
          <a
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`McRelish on ${social.label}`}
            className={linkClassName}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={iconClassName}>
              <path d={socialIconPaths[social.id]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
