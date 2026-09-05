import {
  House,
  ListChecks,
  List,
  Lightbulb,
  Milestone,
  Users,
  MessagesSquare,
  Settings,
  ArrowUpDown,
} from "lucide-react";

export type NavItem = {
  label: string;
  /** Short label for the mobile bottom nav bar, where space is tight. Falls
   * back to `label` if omitted. */
  mobileLabel?: string;
  href: (slug: string) => string;
  icon: typeof House;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: (slug) => `/app/${slug}`, icon: House },
  { label: "My Work", href: (slug) => `/app/${slug}/my-work`, icon: ListChecks },
  {
    label: "Product Backlog",
    mobileLabel: "Backlog",
    href: (slug) => `/app/${slug}/work`,
    icon: List,
  },
  {
    label: "Task Prioritization",
    mobileLabel: "Task Priority",
    href: (slug) => `/app/${slug}/business-prioritization`,
    icon: ArrowUpDown,
  },
  { label: "Ideas", href: (slug) => `/app/${slug}/ideas`, icon: Lightbulb },
  { label: "Roadmap", href: (slug) => `/app/${slug}/roadmap`, icon: Milestone },
  { label: "Team", href: (slug) => `/app/${slug}/team`, icon: Users },
  { label: "Standup", href: (slug) => `/app/${slug}/standup`, icon: MessagesSquare },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: (slug) => `/app/${slug}/settings`,
  icon: Settings,
};
