# UI/UX Design Guide - Inventory Management System

## Design System
- **Color Scheme:**
  - Primary: Blue (#2563EB) - CTAs, highlights
  - Secondary: Purple (#9333EA) - Secondary actions
  - Success: Green (#22C55E) - Active status
  - Warning: Yellow (#EABB16) - Inactive status
  - Error: Red (#DC2626) - Danger actions
  - Neutral: Gray (#F3F4F6, #6B7280, #1F2937)

- **Typography:**
  - Headers: Bold, large sizes (24px, 30px)
  - Body: Regular 14-16px
  - Labels: Medium 12-14px

- **Spacing:** Tailwind CSS default spacing (4px increments)
- **Rounded Corners:** 8px standard, 12px for cards
- **Shadows:** md (0 4px 6px) for cards, lg (0 10px 15px) for modals

---

## Page Layouts

### 1. LOGIN PAGE (`/login`)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         Blue Gradient Background                │
│                                                 │
│              ┌───────────────────┐              │
│              │   Inventory       │              │
│              │ Management System │              │
│              │   (Logo Area)     │              │
│              └───────────────────┘              │
│                                                 │
│         EMAIL INPUT FIELD                       │
│         PASSWORD INPUT FIELD                    │
│         [SIGN IN BUTTON]                        │
│         ────── OR ──────                        │
│         Demo Credentials Info                   │
│         [Sign Up Link]                          │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Features:**
- Responsive form (mobile-first)
- Validation messages
- Demo credentials display
- Blue/white color scheme
- Shadow and rounded corners for modern look

---

### 2. DASHBOARD (`/dashboard`)
```
┌──────────────────────────────────────────────────────┐
│ Inventory System        Welcome, Admin User [Logout] │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Product Inventory                                    │
│ Manage your products and categories efficiently      │
│                                                      │
│ [+ Add Product] [📁 Categories] [📊 Reports]        │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ [Search...] [Category ▼] [Status ▼] [Search]    ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Product │ SKU │ Category │ Price │ Qty │ Status │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ Laptop  │ LP1 │ Electr.. │$1299 │ 5   │ Active │ │
│ │ Mouse   │ WM2 │ Electr.. │ $29  │ 50  │ Active │ │
│ │ Cable   │ UC3 │ Electr.. │ $12  │ 3   │ Inact. │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Features:**
- Top navigation with logout
- Action buttons for CRUD
- Search + Filter section (3 columns)
- Product table with hover effects
- Status badges with color coding
- Edit/Delete inline actions
- Low stock highlighting (red text)
- Empty state message

---

### 3. ADD/EDIT PRODUCT (`/products/new`, `/products/edit/:id`)
```
┌──────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                  │
│                                                      │
│ Add New Product                                      │
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ Product Name        │ SKU                         ││
│ │ [________...]       │ [________...]              ││
│ │                                                  ││
│ │ Category            │ Price ($)                  ││
│ │ [Select ▼]          │ [______.00]                ││
│ │                                                  ││
│ │ Quantity            │ Min Stock Level            ││
│ │ [____]              │ [____]                     ││
│ │                                                  ││
│ │ Supplier            │ Status                     ││
│ │ [________...]       │ [Active ▼]                 ││
│ │                                                  ││
│ │ Description                                      ││
│ │ [________________________________]               ││
│ │                                                  ││
│ │ Product Images                                   ││
│ │ ┌──────────────────────────────┐                ││
│ │ │  Click to upload Images      │                ││
│ │ │  PNG, JPG, GIF up to 5MB     │                ││
│ │ └──────────────────────────────┘                ││
│ │ [Image] [Image] [Image] [Image]                 ││
│ │   ×        ×        ×        ×                   ││
│ │                                                  ││
│ │ [Add Product]  [Cancel]                         ││
│ └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Features:**
- 2-column form grid (responsive)
- File upload with drag-and-drop
- Image preview thumbnails
- Remove image functionality
- Submit and cancel buttons
- Form validation

---

### 4. CATEGORIES PAGE (Placeholder - to be built)
```
Similar to Dashboard but for categories:
- List of categories
- Add/Edit/Delete categories
- Category image preview
- Description field
```

---

## Responsive Breakpoints
- **Mobile (0px):** Single column, full-width inputs
- **Tablet (768px):** 2 columns for forms
- **Desktop (1024px+):** Full layout with max-width constraints

---

## Interactive Elements
1. **Buttons:**
   - Primary: Blue background, white text, hover darker
   - Secondary: Purple, green, or red variants
   - Disabled: Gray background

2. **Form Inputs:**
   - Border gray, 2px blue focus ring
   - Padding 8px, rounded 8px

3. **Tables:**
   - Hover: Light gray background
   - Striped rows optional
   - Responsive: Scroll on mobile

4. **Status Badges:**
   - Active: Green background, dark text
   - Inactive: Yellow background
   - Discontinued: Red background

5. **Notifications:**
   - Success: Green toast
   - Error: Red toast
   - Info: Blue toast

---

## Next Steps for UI/UX Approval
1. **Review all mockups above** ✓
2. **Confirm color scheme** → Any changes?
3. **Validate layout** → Any layout changes?
4. **Check responsive design** → Mobile-friendly?
5. Once approved → Build remaining components (Categories, etc.)
