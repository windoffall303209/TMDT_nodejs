# Design System: Clean Atelier — WIND OF FALL Storefront

> **Updated:** April 2026  
> **Previous system:** Grounded Luxury (deprecated)  
> **Aesthetic:** Light-mode minimalist, inspired by COS / Everlane / Arket

---

## 1. Creative Direction

**Clean Atelier** re-imagines the WIND OF FALL storefront as a modern fashion atelier — a quiet, confident space where the product photography does the talking. We strip away visual clutter (gradients, heavy borders, warm gold tones) and replace it with:

- **Generous whitespace** to create breathing room
- **Typographic hierarchy** using geometric display font Outfit
- **Neutral tonal layering** instead of borders for depth
- **Micro-animations** for tactile feedback

The design philosophy is: *"Make the product the hero, not the UI."*

---

## 2. Design Tokens

### Colors
| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#FAFAF8` | Page canvas (warm off-white) |
| `--bg-elevated` | `#FFFFFF` | Cards, panels |
| `--bg-subtle` | `#F5F5F3` | Section backgrounds, inputs |
| `--bg-inverse` | `#1A1A1A` | Primary buttons, footer |
| `--text` | `#1A1A1A` | Primary text |
| `--text-soft` | `#4A4A4A` | Secondary text |
| `--text-muted` | `#8A8A8A` | Tertiary text, captions |
| `--accent` | `#C4A882` | Warm gold (logo, links, highlights) |
| `--border` | `#E8E8E6` | Default borders |
| `--border-strong` | `#D1D1CF` | Active/hover borders |
| `--success` | `#2D8B55` | Stock available, confirmations |
| `--error` | `#D64545` | Out of stock, errors |
| `--warning` | `#D4920A` | Pending states |

### Typography
| Token | Font | Weight | Usage |
|---|---|---|---|
| `--font-display` | Outfit | 600–800 | Headlines, CTAs, product names |
| `--font-body` | Inter | 400–600 | Body text, labels, descriptions |

**Scale:** `--text-xs` (0.75rem) → `--text-hero` (4rem)

### Spacing
4px grid system: `--space-1` (4px) through `--space-16` (64px).

### Radius
| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 6px | Thumbnails, inputs |
| `--radius-md` | 10px | Buttons, form fields |
| `--radius-lg` | 16px | Cards, panels |
| `--radius-xl` | 24px | Large containers |
| `--radius-full` | 9999px | Pills, badges |

### Shadows
Neutral gray only — no mocha tints:
- `--shadow-sm`: `0 1px 3px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 4px 16px rgba(0,0,0,0.06)`
- `--shadow-lg`: `0 12px 40px rgba(0,0,0,0.08)`

---

## 3. Layout Structure

### Header (3-tier)
1. **Announcement Bar** — Black (#1A1A1A) with white text. Sticky, slim.
2. **Main Row** — Logo | Search | Auth/Cart actions. White background.
3. **Navigation** — Category links with active dot indicator.

### Footer (Dark)
Background: `#1A1A1A`. Newsletter section + 4-column grid + payment badges.

### Content Grid
- Max-width: 1340px  
- Product grids: 4-col (desktop) → 2-col (tablet) → 1-col (mobile)
- Section padding: `64px 0` (desktop), `40px 0` (mobile)

---

## 4. Component Guidelines

### Buttons
| Type | Style |
|---|---|
| Primary | `bg-inverse` bg, `text-inverse` text, `radius-full` |
| Secondary | Transparent bg, `border-strong` border, `radius-full` |
| Ghost | No border, text only, underline on hover |

### Cards (Product)
- No explicit border (use subtle shadow or background contrast)
- Image: `bg-subtle` background, 3:4 aspect ratio
- Hover: `translateY(-4px)` with shadow deepening

### Form Inputs
- `48px` min height, `radius-md`, `border` default
- Focus: `border → accent`, `box-shadow: 0 0 0 3px accent-subtle`

### Badges & Pills
- `radius-full`, small font (11px), uppercase tracking

---

## 5. Rules

### Do ✅
- Use Outfit for all headings and display text
- Use neutral gray shadows (never warm-tinted)
- Favor whitespace over visual elements for separation
- Use `translateY` for hover lift effects
- Use `backdrop-filter: blur` for overlays

### Don't ❌
- Don't use gold/warm gradients (legacy Grounded Luxury)
- Don't use `rgba(215, 197, 154, ...)` borders (old palette)
- Don't use `#faf4e8`, `#f8f1e5`, or any warm cream tones
- Don't use `border-radius: 28px+` for cards (max is 24px)
- Don't use font-weight 800 (max is 700 for body, 800 for display only)

---

## 6. File Architecture

### CSS Files (Storefront)
| File | Scope |
|---|---|
| `style.css` | Design tokens + base components + reset |
| `home.css` | Homepage sections |
| `product-list.css` | Product listing & category pages |
| `product-detail.css` | PDP, gallery, reviews |
| `cart.css` | Cart page |
| `checkout.css` | Checkout flow + address forms |
| `orders.css` | Order history & confirmation |
| `tracking.css` | Order tracking |
| `user-profile.css` | User profile |
| `policy.css` | Policy pages |
| `auth/*.css` | Auth flows (login/register in style.css) |

### Admin CSS (Separate)
Admin panel (`admin.css`, `admin-overhaul.css`, etc.) is independent from storefront design.

---

## 7. Migration Notes

The following files have been **removed** from the project:
- ~~`grounded-luxury.css`~~ — Legacy design system, deleted.

All references to the old `--hero-dark`, `--accent-strong`, `--surface-soft`, `rgba(215, 197, 154, ...)` palette have been replaced with the new Clean Atelier tokens.