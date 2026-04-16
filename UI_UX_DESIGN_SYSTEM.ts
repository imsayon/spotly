// UI/UX Design System Documentation
// Spotly - Queue Management Platform

// ============================================================================
// DESIGN PRINCIPLES
// ============================================================================

/**
 * 1. PROFESSIONAL & MODERN
 *    - Icons instead of emojis (Lucide React)
 *    - Clean typography with Outfit font
 *    - Generous whitespace and padding
 *    - Glass-morphism effects with backdrop blur
 *    - Smooth transitions (300-500ms)
 *
 * 2. RESPONSIVE & ACCESSIBLE
 *    - Mobile-first design approach
 *    - Touch-friendly button sizes (min 44px)
 *    - Color contrast compliance
 *    - Keyboard navigation support
 *    - Loading states and error handling
 *
 * 3. INTERACTIVE & ANIMATED
 *    - Page transitions with Framer Motion
 *    - Hover effects on interactive elements
 *    - Scroll-triggered animations
 *    - Smooth state changes
 *    - Micro-interactions for feedback
 *
 * 4. CONSUMER-FOCUSED
 *    - Bright, welcoming colors for consumer app
 *    - Easy product/service discovery
 *    - Clear call-to-actions
 *    - Shopping cart functionality
 *    - Real-time wait time information
 *
 * 5. MERCHANT-CENTRIC
 *    - Powerful dashboard for merchant management
 *    - Deep customization capabilities
 *    - Analytics and insights
 *    - Multi-outlet support
 *    - Verification & credibility indicators
 */

// ============================================================================
// COLOR SYSTEM
// ============================================================================

// MERCHANT APP - Green Focus
// Primary: #22c55e (Emerald Green)
// Accent variations: Blue, Cyan, Purple, Pink, Orange
// Perfect for dashboard operations and professional context

// CONSUMER APP - Yellow/Orange Focus
// Primary: Golden Gradient (#facc15 → #ff6b35)
// Accent variations: Blue, Cyan, Purple, Pink
// Perfect for vibrant, approachable consumer experience

// ============================================================================
// COMPONENT PATTERNS
// ============================================================================

/*
BUTTONS:
--------
btn-primary       - Main action (full-width on mobile, sized on desktop)
btn-secondary     - Alternative action
btn-tertiary      - Minimal action  
btn-ghost         - Text-only action
btn-danger        - Destructive action

Sizes:
- sm:  px-4 py-2 (form-like contexts)
- md:  px-6 py-3 (default)
- lg:  px-10 py-5 (hero CTAs)

CARDS:
------
.card             - Glass panel with hover lift
.card-interactive - Clickable card variant
.animated         - Scroll-triggered animation

INPUTS:
-------
.input-field      - Text input with focus states
.textarea-field   - Multi-line input
label             - Always visible label above

BADGES:
-------
.badge            - Default (brand color)
.badge-success    - Green
.badge-warning    - Orange
.badge-error      - Red

LAYOUT:
-------
Glass-panel       - Frosted glass effect background
gradient-overlay  - Subtle gradient on components
hover-lift        - -1px y-translation on hover
hover-scale       - 105% scale on hover
*/

// ============================================================================
// ANIMATION PATTERNS
// ============================================================================

/*
FRAMER MOTION VARIANTS:

containerVariants:
- Stagger children with delay
- Used for grid/list layouts
- Creates cascade effect

itemVariants:
- Individual item animation
- Opacity fade + y-translation
- 500ms duration

Page Entry:
- Fade in from 0s
- Slide up on section elements
- Stagger grid items

Scroll Triggers:
- whileInView for lazy animations
- viewport={{ once: true }}
- Prevents animation rerun

Hover Effects:
- Scale transforms on cards
- Border/bg color changes
- Filter/blur effects

Exit Animations:
- AnimatePresence wrapper required
- Smooth removal of elements
- Used for modals/sidebars
*/

// ============================================================================
// MERCHANT APP STRUCTURE
// ============================================================================

/*
Landing Page (/)
├─ Navigation (sticky)
├─ Hero Section
│  ├─ Badge (Merchant Portal 1.0)
│  ├─ Heading
│  ├─ Description
│  └─ CTA (Start Free with Google)
├─ Stats Section (3-column grid)
├─ Features Section (2x2 grid)
│  ├─ Real-time Queue Sync
│  ├─ Mobile Dashboard
│  ├─ Analytics & Insights
│  └─ Secure & Reliable
└─ CTA & Footer

Dashboard (/dashboard)
├─ Header (sticky)
│  ├─ Logo + Merchant Name
│  └─ Settings/Help buttons
├─ Verification Card (warning state)
├─ Profile Section
│  ├─ Avatar (12x12)
│  ├─ Name + Category
│  ├─ Verification Badge
│  └─ Details (Address, Phone)
├─ Stats Card (3-column)
├─ Estimated Wait Time Card
├─ Outlets Grid
│  ├─ Active outlet cards
│  ├─ Queue count
│  └─ Edit/Queue buttons
└─ Analytics (4-column metric cards)

Outlets (/outlets)
├─ Header (sticky)
├─ Create Outlet Form (animated modal)
├─ Outlets Grid (2-column on large)
│  ├─ View Mode
│  │  ├─ Store icon
│  │  ├─ Name + status
│  │  ├─ Address/Hours/Phone
│  │  └─ View Queue + Edit buttons
│  └─ Edit Mode
│     ├─ Name input
│     ├─ Address input
│     ├─ Hours input
│     ├─ Coming Soon sections
│     └─ Save/Cancel buttons
└─ Empty State (if no outlets)
*/

// ============================================================================
// CONSUMER APP STRUCTURE
// ============================================================================

/*
Landing Page (/)
├─ Animated Background (glowing orbs)
├─ Navigation (sticky, blur on scroll)
├─ Hero Section
│  ├─ Badge
│  ├─ Heading
│  ├─ Description
│  ├─ CTA Buttons
│  └─ Stats (3-column)
├─ Featured Stores
│  ├─ Section Title
│  ├─ Search + Filter
│  └─ Store Grid (3-column)
│     └─ Store Cards
│        ├─ Image/Icon
│        ├─ Name + Category
│        ├─ Rating + Reviews
│        ├─ Wait Time + Price
│        └─ Action Buttons
├─ Pagination
├─ Why Spotly Section (2x2 feature grid)
├─ CTA Section
└─ Footer

Home (/home)
├─ Navigation (sticky, dynamic)
│  ├─ Logo
│  ├─ Location Display
│  ├─ Shopping Cart (with badge)
│  └─ Logout
├─ Discovery Section
│  ├─ Title
│  ├─ Search Input
│  └─ Category Pills (horizontal scroll)
├─ Stores Grid
│  └─ Professional Cards
│     ├─ Visual Container (emoji icon)
│     ├─ Status Indicator (green dot)
│     ├─ Wait Time Badge (yellow)
│     ├─ Basic Info
│     ├─ Rating + Reviews
│     └─ Action Buttons
├─ Loading States (skeleton cards)
└─ Empty State (if no results)

Shopping Cart (sidebar)
├─ Header + Close button
├─ Items List (scrollable)
│  └─ Item Card
│     ├─ Name + Merchant
│     ├─ Price
│     ├─ Quantity Controls
│     └─ Remove Button
├─ Empty State Message
└─ Footer
   ├─ Subtotal
   └─ Checkout Button
*/

// ============================================================================
// RESPONSIVE BREAKPOINTS
// ============================================================================

/*
Mobile (< 640px):
- Full-width cards
- Single column layouts
- Collapsed navigation
- Bottom action bars

Small (sm: 640px):
- 2-column grids possible
- Horizontal scrolling for filters
- Touch-optimized spacing

Medium (md: 768px):
- 2-column primary layouts
- Sidebar navigation shows

Large (lg: 1024px):
- 3+ column grids
- Full navigation visible
- Maximum width containers (max-w-7xl)

Extra Large (xl: 1280px):
- Same as lg, content fills space
*/

// ============================================================================
// INTERACTION DESIGN
// ============================================================================

/*
LOADING STATES:
- Spinner inside button
- Disabled state during action
- Message confirmation after success

ERROR STATES:
- Input fields with red border
- Error message below field
- Toast/banner for form errors

SUCCESS FEEDBACK:
- Toast notification
- Green checkmark
- Brief message
- Auto-dismiss or manual close

EMPTY STATES:
- Large icon (48x48)
- Clear headline
- Helpful description
- Action button to populate

HOVER EFFECTS:
- Card: bg color change + border lift
- Button: shadow glow + scale
- Link: underline + color change
- Input: border color shift
*/

// ============================================================================
// COMING SOON FEATURES
// ============================================================================

/*
MERCHANT:
- Floor plan customization
- Inventory category management
- Location map integration
- Advanced analytics
- Customer verification
- Multi-language support

CONSUMER:
- Saved favorites (hearts)
- Order history
- Loyalty programs
- Real-time notifications
- Payment integration
- Wishlist sharing

SHARED:
- Video chat support
- AR queue visualization
- Advanced search filters
- Social sharing
- Review system
*/

// ============================================================================
// PERFORMANCE CONSIDERATIONS
// ============================================================================

/*
- Lazy load images
- Defer animations on slower devices
- Skeleton loading states
- Pagination instead of infinite scroll
- Production image optimization
- CSS animation over JS where possible
- Memoize expensive components
- Debounce search inputs
*/

export {}
