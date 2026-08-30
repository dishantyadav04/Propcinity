// Guest access limits — single source of truth.
// Changing a number here changes behaviour across the whole app.

export const GUEST_LIMITS = {
  explore: {
    visibleCards: 6,
    filtersAllowed: false,
    sortAllowed: true,
    mapAllowed: false,
  },
  compare: {
    visibleRows: 4,
  },
  project: {
    freeTabs: ['overview', 'location', 'amenities', 'pros-cons', 'legal', 'rera'],
    lockedTabs: ['floor-plans', 'pricing', 'builder'],
    emiLocked: true,
    aiLocked: true,
    dashboardActionLocked: true,
  },
} as const
