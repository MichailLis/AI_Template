export const adminToneClassNames = {
  info: {
    active: 'border-admin-info-border bg-admin-info-soft text-admin-info-foreground shadow-sm',
    icon: 'bg-admin-info-soft text-admin-info',
    surface: 'bg-admin-info-soft/30',
    softSurface: 'bg-admin-info-soft/80',
    text: 'text-admin-info-foreground',
    textAccent: 'text-admin-info',
    border: 'border-admin-info-border',
    gradient: 'from-admin-info to-admin-accent',
  },
  success: {
    active:
      'border-admin-success-border bg-admin-success-soft text-admin-success-foreground shadow-sm',
    icon: 'bg-admin-success-soft text-admin-success',
    surface: 'bg-admin-success-soft/30',
    softSurface: 'bg-admin-success-soft/80',
    text: 'text-admin-success-foreground',
    textAccent: 'text-admin-success',
    border: 'border-admin-success-border',
    gradient: 'from-admin-success to-admin-accent',
  },
  warning: {
    active:
      'border-admin-warning-border bg-admin-warning-soft text-admin-warning-foreground shadow-sm',
    icon: 'bg-admin-warning-soft text-admin-warning',
    surface: 'bg-admin-warning-soft/30',
    softSurface: 'bg-admin-warning-soft/80',
    text: 'text-admin-warning-foreground',
    textAccent: 'text-admin-warning',
    border: 'border-admin-warning-border',
    gradient: 'from-admin-warning to-admin-danger',
  },
  danger: {
    active:
      'border-admin-danger-border bg-admin-danger-soft text-admin-danger-foreground shadow-sm',
    icon: 'bg-admin-danger-soft text-admin-danger',
    surface: 'bg-admin-danger-soft/30',
    softSurface: 'bg-admin-danger-soft/80',
    text: 'text-admin-danger-foreground',
    textAccent: 'text-admin-danger',
    border: 'border-admin-danger-border',
    gradient: 'from-admin-danger to-admin-accent',
  },
  neutral: {
    active: 'border-admin-border bg-admin-panel-muted text-admin-foreground shadow-sm',
    icon: 'bg-admin-panel-muted text-admin-muted',
    surface: 'bg-admin-panel-muted/60',
    softSurface: 'bg-admin-panel-muted/80',
    text: 'text-admin-foreground',
    textAccent: 'text-admin-muted',
    border: 'border-admin-border',
    gradient: 'from-admin-muted to-admin-border',
  },
  accent: {
    active:
      'border-admin-accent-border bg-admin-accent-soft text-admin-accent-foreground shadow-sm',
    icon: 'bg-admin-accent-soft text-admin-accent',
    surface: 'bg-admin-accent-soft/30',
    softSurface: 'bg-admin-accent-soft/80',
    text: 'text-admin-accent-foreground',
    textAccent: 'text-admin-accent',
    border: 'border-admin-accent-border',
    gradient: 'from-admin-accent to-admin-success',
  },
} as const;

export type AdminTone = keyof typeof adminToneClassNames;

export const adminBadgeClassNames = {
  success: 'border-admin-success-border bg-admin-success-soft text-admin-success-foreground',
  warning: 'border-admin-warning-border bg-admin-warning-soft text-admin-warning-foreground',
  danger: 'border-admin-danger-border bg-admin-danger-soft text-admin-danger-foreground',
  neutral: 'border-admin-border bg-admin-panel-muted text-admin-muted',
  info: 'border-admin-info-border bg-admin-info-soft text-admin-info-foreground',
  protected:
    'gap-2 border-admin-success-border bg-admin-success-soft text-admin-success-foreground hover:bg-admin-success-soft [&_svg]:size-3.5',
  workspace:
    'rounded-full border border-admin-border bg-admin-panel-muted px-3 py-1 text-xs font-medium text-admin-muted',
  fresh:
    'rounded-full border border-admin-border bg-admin-panel px-2.5 py-1 text-xs font-medium text-admin-muted',
  active: 'border-admin-success-border bg-admin-success-soft text-admin-success-foreground',
  planned: 'border-admin-warning-border bg-admin-warning-soft text-admin-warning-foreground',
  notice: 'border-admin-info-border bg-admin-info-soft text-admin-info-foreground',
  archived: 'border-admin-border bg-admin-panel-muted text-admin-muted',
  inactive: 'border-admin-warning-border bg-admin-warning-soft text-admin-warning-foreground',
  pillSuccess:
    'rounded-full border border-admin-success-border bg-admin-success-soft px-2 py-0.5 text-xs font-medium text-admin-success-foreground',
  pillNeutral:
    'rounded-full border border-admin-border bg-admin-panel-muted px-2 py-0.5 text-xs font-medium text-admin-muted',
  pillWarning:
    'rounded-full border border-admin-warning-border bg-admin-warning-soft px-2 py-0.5 text-xs font-medium text-admin-warning-foreground',
  roleAdmin:
    'border-admin-danger-border bg-admin-danger-soft text-admin-danger-foreground hover:bg-admin-danger-soft',
  roleUser:
    'border-admin-info-border bg-admin-info-soft text-admin-info-foreground hover:bg-admin-info-soft',
} as const;

export type AdminBadgeTone = keyof typeof adminBadgeClassNames;

export const adminClassNames = {
  shell: {
    root: 'min-h-screen w-full bg-[linear-gradient(180deg,hsl(var(--admin-canvas))_0%,hsl(var(--admin-canvas-soft))_48%,hsl(var(--admin-canvas-warm))_100%)] text-admin-foreground',
    layout: 'grid min-h-screen w-full md:grid-cols-[18rem_minmax(0,1fr)]',
    content: 'flex min-w-0 flex-col',
    main: 'flex-1 p-4 md:p-6 lg:p-8',
  },
  nav: {
    button:
      'h-9 w-full justify-start gap-2 rounded-lg border border-transparent px-2.5 text-admin-muted hover:border-admin-border hover:bg-admin-panel hover:text-admin-foreground hover:shadow-sm',
    mobileButton: 'h-8 bg-admin-panel/80 shadow-sm',
    icon: 'grid size-6 place-items-center rounded-md bg-admin-panel-muted text-admin-muted',
    groupLabelMobile: 'mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted',
    groupLabelDesktop:
      'mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-admin-muted',
  },
  sidebar: {
    desktop:
      'hidden overflow-hidden border-r border-admin-border/80 bg-admin-panel/90 text-admin-foreground shadow-[1px_0_0_hsl(var(--admin-foreground)/0.03)] backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:flex-col',
    header: 'flex h-16 items-center border-b border-admin-border/80 px-5',
    brandMark:
      'rounded-lg bg-gradient-to-br from-admin-info via-admin-accent to-admin-success px-2 py-1 text-xs font-semibold text-white shadow-sm',
    brandTitle: 'block text-sm font-semibold text-admin-foreground',
    brandSubtitle: 'block text-xs text-admin-muted',
    nav: 'flex-1 overflow-hidden p-3',
    footer: 'border-t border-admin-border/80 p-4',
    workspaceCard: 'rounded-xl border border-admin-success-border bg-admin-success-soft/80 p-3',
    workspaceLabel:
      'flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-admin-success-foreground',
    workspaceDot: 'size-2 rounded-full bg-admin-success',
    workspaceTitle: 'mt-1 text-sm font-medium text-admin-foreground',
  },
  header: {
    root: 'sticky top-0 z-10 border-b border-admin-border/80 bg-admin-panel/90 backdrop-blur',
    eyebrow: 'text-xs font-medium uppercase tracking-wide text-muted-foreground',
    title: 'text-sm font-semibold text-foreground',
    input: 'w-64 border-admin-border bg-admin-panel-muted/80 shadow-sm lg:w-80',
    button: 'bg-admin-panel shadow-sm',
    userBadge:
      'max-w-48 truncate rounded-lg border border-admin-border bg-admin-panel px-3 py-1.5 text-xs font-medium text-admin-muted shadow-sm',
    mobileNav: 'border-t border-admin-border/80 bg-admin-panel-muted/80 px-4 py-3 md:hidden',
  },
  panel: {
    card: 'min-w-0 border-admin-border/80 bg-admin-panel shadow-sm',
    cardMuted: 'min-w-0 border-admin-border bg-admin-panel-muted/80 shadow-sm',
    errorCard: 'min-w-0 border-admin-danger-border bg-admin-danger-soft shadow-sm',
    hero: 'min-w-0 overflow-hidden border-admin-border/80 bg-admin-panel shadow-sm',
    frame: 'rounded-md border border-admin-border bg-admin-panel',
    section: 'rounded-xl border border-admin-border bg-admin-panel p-3 shadow-sm',
    mutedSection: 'rounded-xl border border-admin-border bg-admin-panel-muted/70 px-3 py-2',
    compactSection: 'rounded-md border border-admin-border bg-admin-panel-muted p-3',
    compactCard: 'rounded-md border border-admin-border bg-admin-panel p-3',
    subtleCard: 'rounded-md border border-admin-border bg-admin-panel p-3 shadow-sm',
    loading:
      'rounded-md border border-admin-border bg-admin-panel-muted p-4 text-sm text-admin-muted',
    empty: 'rounded-md border border-dashed border-admin-border p-4 text-sm text-admin-muted',
    emptyCenter:
      'rounded-md border border-dashed border-admin-border p-6 text-center text-sm text-admin-muted',
    infoInline:
      'rounded-md border border-admin-info-border bg-admin-info-soft px-3 py-2 text-sm text-admin-info-foreground',
    warningInline:
      'rounded-md border border-admin-warning-border bg-admin-warning-soft px-3 py-2 text-sm text-admin-warning-foreground',
    dangerInline:
      'rounded-md border border-admin-danger-border bg-admin-danger-soft px-3 py-2 text-sm text-admin-danger-foreground',
    listRow:
      'border-b border-admin-border p-4 transition-colors last:border-b-0 hover:bg-admin-panel-muted/60',
    selectedRow: 'bg-admin-panel-muted',
    inlineItem: 'flex items-start gap-3 rounded-md bg-admin-panel p-3 text-sm shadow-sm',
    mutedBar: 'bg-admin-panel-muted',
    interactive:
      'rounded-xl border border-admin-border bg-admin-panel-muted/60 shadow-sm transition-[border-color,background-color,box-shadow] hover:border-admin-border hover:bg-admin-panel hover:shadow-md',
  },
  editor: {
    shell:
      'grid grid-cols-[44px_minmax(0,1fr)] overflow-hidden rounded-md border border-admin-border',
    rail: 'overflow-hidden border-r border-admin-border bg-admin-panel-muted text-right',
  },
  form: {
    select:
      'h-10 w-full rounded-md border border-admin-border bg-admin-panel px-3 py-2 text-sm text-admin-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-admin-panel-muted disabled:text-admin-muted',
    range: 'h-2 w-full cursor-pointer appearance-none rounded-lg bg-admin-border accent-primary',
    checkboxLabel: 'flex items-center gap-2 text-sm text-admin-foreground',
    fieldHint: 'text-xs text-admin-muted',
    warningInput:
      'border-admin-warning-border bg-admin-warning-soft focus-visible:ring-admin-warning',
  },
  iconButton: {
    muted: 'text-admin-muted hover:text-admin-foreground',
    danger: 'text-admin-muted hover:bg-admin-danger-soft hover:text-admin-danger-foreground',
  },
  dialog: {
    content: 'border-admin-border',
  },
  switch: {
    active: 'bg-admin-success',
    inactive: 'bg-admin-border',
    thumb: 'inline-block h-5 w-5 rounded-full bg-admin-panel transition-transform',
  },
  code: {
    block: 'max-h-48 overflow-auto rounded-md bg-admin-foreground p-3 text-xs text-white',
    softBlock:
      'max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-admin-panel-muted p-3 text-xs text-admin-foreground',
  },
  drag: {
    ring: 'ring-2 ring-admin-info-border',
    indicator: 'bg-admin-info',
  },
  text: {
    muted: 'text-admin-muted',
    body: 'text-admin-muted',
    heading: 'text-admin-foreground',
    label: 'text-admin-muted',
    kicker: 'text-xs font-medium uppercase tracking-wide text-admin-muted',
    linkInfo: 'text-admin-info-foreground hover:text-admin-info',
    hoverHeading: 'hover:text-admin-foreground',
  },
  border: {
    top: 'border-t border-admin-border',
    bottom: 'border-b border-admin-border',
    right: 'border-r border-admin-border',
    separatorText: 'text-admin-border',
  },
  publicLinks: {
    rowBase:
      'flex flex-col justify-between gap-3 border-b border-l-2 border-admin-border p-4 transition-colors last:border-b-0 sm:flex-row sm:items-center',
    rowArchived:
      'border-l-admin-border bg-admin-panel text-admin-muted hover:bg-admin-panel-muted/60',
    rowInactive:
      'border-l-admin-warning bg-admin-panel text-admin-foreground hover:bg-admin-warning-soft/60',
    rowActive:
      'border-l-transparent bg-admin-panel text-admin-foreground hover:bg-admin-panel-muted/60',
    divider: 'text-admin-border',
    inactiveNotice: 'text-admin-warning-foreground',
  },
  overview: {
    heroRail:
      'absolute inset-y-6 left-0 w-1 rounded-r-full bg-gradient-to-b from-admin-info via-admin-success to-admin-warning',
    heroPulsePanel:
      'border-t border-admin-border bg-admin-panel-muted/80 p-5 lg:border-l lg:border-t-0',
    primaryButton: 'bg-admin-foreground text-white hover:bg-admin-foreground/90',
    noticeCard: 'border-admin-info-border bg-admin-info-soft/80 shadow-none',
    noticeContent: 'flex flex-col gap-3 p-4 text-admin-info-foreground sm:flex-row sm:items-center',
  },
  table: {
    container: 'overflow-hidden rounded-lg border border-admin-border bg-admin-panel shadow-sm',
    header: 'bg-admin-panel-muted/50',
    emptyCell: 'py-12 text-center text-sm text-admin-muted',
    clickableRow: 'cursor-pointer hover:bg-admin-panel-muted/40',
    mutedCell: 'text-admin-muted',
  },
  toolbar: {
    tabs: 'inline-flex w-fit flex-wrap rounded-lg border border-admin-border bg-admin-panel-muted p-1',
    activeTab: 'bg-admin-panel shadow-sm hover:bg-admin-panel',
    inactiveTab: 'text-admin-muted hover:text-admin-foreground',
    input: 'bg-admin-panel',
  },
  filters: {
    input: 'w-full max-w-sm bg-admin-panel shadow-sm',
    total:
      'ml-auto rounded-full border border-admin-border bg-admin-panel px-3 py-1.5 text-sm text-admin-muted shadow-sm',
  },
  actionMenu: {
    card: 'absolute right-0 top-10 z-20 w-48 border-admin-border shadow-md',
    content: 'flex flex-col gap-2 p-2',
    item: 'h-8 justify-start px-2 text-left text-sm',
    dangerItem:
      'h-8 justify-start px-2 text-left text-sm text-admin-danger hover:bg-admin-danger-soft hover:text-admin-danger-foreground',
  },
  pagination: {
    root: 'flex flex-wrap items-center justify-between gap-3 border-t border-admin-border pt-4',
    badge:
      'rounded-lg border border-admin-border bg-admin-panel-muted/40 px-3 py-1.5 text-sm text-admin-muted',
  },
  stateBlock: {
    base: 'flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm',
    action: 'mt-4',
    muted: 'border-admin-border bg-admin-panel-muted/30 text-admin-muted',
    danger: 'border-admin-danger-border bg-admin-danger-soft text-admin-danger-foreground',
  },
} as const;

export const getAdminRoleBadgeClassName = (role: string) => {
  if (role === 'ADMIN') {
    return adminBadgeClassNames.roleAdmin;
  }

  return adminBadgeClassNames.roleUser;
};
