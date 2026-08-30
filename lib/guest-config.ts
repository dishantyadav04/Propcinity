// Guest access limits — single source of truth.
// Changing a number here changes behaviour across the whole app.

export const GUEST_LIMITS = {
  explore: {
    visibleCards: 6,         // Show first 6 cards, blur/placeholder the rest
    filtersAllowed: false,   // Filter panel is locked
    sortAllowed: false,      // Only default sort; other options show lock icon
    mapAllowed: false,       // Map view toggle hidden
  },
  compare: {
    visibleRows: 4,          // Show first 4 rows (Price, Config, Builder, RERA); rest blurred
  },
  project: {
    // Tab IDs that are freely visible to guests
    freeTabs: ['overview', 'location', 'amenities'],
    // Tab IDs that are locked for guests
    lockedTabs: ['floor-plans', 'pricing', 'pros-cons', 'legal', 'rera', 'builder'],
    emiLocked: true,         // EMI calculator row inside Pricing tab
    aiLocked: true,          // Ask AI button
    dashboardActionLocked: true, // Add to Dashboard / Save buttons
  },
} as const
