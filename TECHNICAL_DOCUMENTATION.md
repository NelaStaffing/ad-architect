# Ad Architect - Technical Documentation

> AI-assisted print advertisement layout generator with Supabase backend and Gemini AI.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture](#architecture)
5. [Database Schema](#database-schema)
6. [Authentication](#authentication)
7. [AI Integration](#ai-integration)
8. [Supabase Edge Functions](#supabase-edge-functions)
9. [Frontend Components](#frontend-components)
10. [Type Definitions](#type-definitions)
11. [API & Data Layer](#api--data-layer)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)
14. [Development Guide](#development-guide)

---

## Overview

**Ad Architect** is a web application designed for creating print-ready advertisements using AI-powered layout generation. Users can:

- Create and manage advertisement projects for clients
- Upload product images and logos as assets
- Generate ad layouts using AI (OpenAI GPT-Image or Gemini via n8n webhooks)
- Review, edit, and approve ad versions
- Share ads with clients for review via secure token-based links
- Receive notifications on review responses
- Export finalized advertisements

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type-safe JavaScript |
| **Vite** | Build tool and dev server |
| **React Router 6** | Client-side routing |
| **TanStack React Query** | Server state management |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (Radix UI primitives) |
| **Lucide React** | Icon library |
| **React Hook Form + Zod** | Form handling and validation |
| **Recharts** | Data visualization |
| **Sonner** | Toast notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Backend-as-a-Service |
| **PostgreSQL** | Database (via Supabase) |
| **Supabase Auth** | Authentication |
| **Supabase Storage** | File storage for assets |
| **Supabase Edge Functions** | Serverless functions (Deno) |

### AI Provider
| Provider | Integration Method |
|----------|-------------------|
| **Gemini** | Via n8n webhook (`N8N_GEMINI_WEBHOOK_URL`) |

---

## Project Structure

```
ad-architect/
├── public/                     # Static assets
│   ├── favicon.ico
│   ├── favicon.svg
│   └── robots.txt
├── src/
│   ├── components/             # React components
│   │   ├── ads/                # Ad-specific components
│   │   ├── ai/                 # AI-related components
│   │   ├── editor/             # Ad editor components
│   │   ├── layout/             # Layout components
│   │   ├── notifications/      # Notification components
│   │   ├── review/             # Review system components
│   │   ├── ui/                 # shadcn/ui components (49 components)
│   │   └── NavLink.tsx         # Navigation link component
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-mobile.tsx      # Mobile detection hook
│   │   ├── use-toast.ts        # Toast notification hook
│   │   └── useAuth.tsx         # Authentication hook/provider
│   ├── integrations/           # External service integrations
│   │   ├── ai/                 # AI provider context
│   │   │   ├── context.tsx     # AiProvider component
│   │   │   └── types.ts        # AI type definitions
│   │   ├── db/                 # Database abstraction layer
│   │   │   ├── adapter.ts      # DbAdapter interface
│   │   │   └── providers/
│   │   │       └── supabaseAdapter.ts  # Supabase implementation
│   │   └── supabase/           # Supabase client
│   │       ├── client.ts       # Supabase client instance
│   │       └── types.ts        # Generated database types
│   ├── lib/
│   │   └── utils.ts            # Utility functions (cn, etc.)
│   ├── pages/                  # Route pages
│   │   ├── AdDetail.tsx        # Ad detail view
│   │   ├── AdEditor.tsx        # Ad editing interface
│   │   ├── AdsGallery.tsx      # Ads listing/gallery
│   │   ├── Auth.tsx            # Authentication page
│   │   ├── ClientDetail.tsx    # Client detail view
│   │   ├── Clients.tsx         # Clients listing
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Landing.tsx         # Landing page
│   │   ├── NewAd.tsx           # Create new ad wizard
│   │   ├── NotFound.tsx        # 404 page
│   │   └── ReviewPage.tsx      # Client review page (token-based)
│   ├── types/                  # TypeScript type definitions
│   │   ├── ad.ts               # Ad-related types
│   │   ├── notification.ts     # Notification types
│   │   └── review.ts           # Review system types
│   ├── App.tsx                 # Root application component
│   ├── App.css                 # Global styles
│   ├── index.css               # Tailwind imports
│   ├── main.tsx                # Application entry point
│   └── vite-env.d.ts           # Vite type declarations
├── supabase/
│   ├── functions/              # Edge Functions
│   │   ├── generate-layouts/   # AI layout generation
│   │   │   └── index.ts
│   │   └── update-ad-specs/    # Ad specs update
│   │       └── index.ts
│   ├── migrations/             # Database migrations (10 files)
│   └── config.toml             # Supabase project config
├── .env                        # Environment variables (local)
├── .env.remote                 # Remote environment template
├── package.json                # Dependencies and scripts
├── tailwind.config.ts          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration
```

---

## Architecture

### Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  App.tsx                                                         │
│  ├── QueryClientProvider (React Query)                          │
│  ├── AuthProvider (Supabase Auth)                               │
│  ├── AiProvider (AI provider context)                           │
│  └── BrowserRouter (React Router)                               │
│      └── Routes (Lazy-loaded pages)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Abstraction Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  DbAdapter Interface (src/integrations/db/adapter.ts)           │
│  └── SupabaseDbAdapter (src/integrations/db/providers/)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
├─────────────────────────────────────────────────────────────────┤
│  ├── PostgreSQL Database                                        │
│  ├── Authentication (Email/Password)                            │
│  ├── Storage (ad-assets bucket)                                 │
│  └── Edge Functions                                             │
│      ├── generate-layouts (AI image generation)                 │
│      └── update-ad-specs                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Providers                               │
├─────────────────────────────────────────────────────────────────┤
│  ├── OpenAI API (direct)                                        │
│  │   └── gpt-image-1 / chatgpt-image-latest                    │
│  └── Gemini (via n8n webhooks)                                  │
│      ├── N8N_GEMINI_WEBHOOK_URL                                 │
│      ├── N8N_REGENERATION_WEBHOOK_URL                           │
│      └── N8N_BIG_CHANGES_WEBHOOK_URL                            │
└─────────────────────────────────────────────────────────────────┘
```

### Routing Structure

| Route | Page | Description | Access |
|-------|------|-------------|--------|
| `/` | Landing | Public landing page | Public |
| `/auth` | Auth | Sign in / Sign up | Public |
| `/dashboard` | Dashboard | Main user dashboard | Authenticated |
| `/manager` | ManagerDashboard | Team oversight dashboard | Manager/Admin |
| `/ads` | AdsGallery | List all ads | Authenticated |
| `/ads/new` | NewAd | Create new ad wizard | Authenticated |
| `/ads/:id` | AdEditor | Edit ad layout | Authenticated |
| `/ads/:id/detail` | AdDetail | View ad details | Authenticated |
| `/clients` | Clients | Client management | Authenticated |
| `/clients/:id` | ClientDetail | Client detail view | Authenticated |
| `/review/:token` | ReviewPage | Client review (public, token-based) | Public |
| `*` | NotFound | 404 page | Public |

---

## Database Schema

### Tables

#### `publications`
Stores print publication specifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Publication name |
| `dpi_default` | INTEGER | Default DPI (default: 300) |
| `min_font_size` | INTEGER | Minimum font size in pt (default: 6) |
| `bleed_px` | INTEGER | Bleed in pixels (default: 0) |
| `safe_px` | INTEGER | Safe margin in pixels (default: 0) |
| `size_presets` | JSONB | Array of size presets |
| `client_id` | UUID | FK to clients (optional) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `clients`
Stores client information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Client name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `publication_issues`
Stores specific publication issues/dates.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `publication_id` | UUID | FK to publications |
| `client_id` | UUID | FK to clients |
| `issue_date` | DATE | Issue date |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `ad_sizes`
Predefined ad size specifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `size_id` | TEXT | Size identifier |
| `ad_size_fraction` | TEXT | Fraction notation (e.g., "1/4") |
| `ad_size_words` | TEXT | Word description |
| `width_in` | NUMERIC | Width in inches |
| `height_in` | NUMERIC | Height in inches |
| `dpi` | INTEGER | Resolution (default: 300) |
| `width_px` | INTEGER | Width in pixels |
| `height_px` | INTEGER | Height in pixels |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `ads`
Main advertisement records.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `client_name` | TEXT | Client name |
| `ad_name` | TEXT | Advertisement name |
| `publication_id` | UUID | FK to publications |
| `publication_issue` | UUID | FK to publication_issues |
| `ad_size_id` | UUID | FK to ad_sizes |
| `aspect_ratio` | TEXT | Aspect ratio (1:1, 3:4, 4:3, 9:16, 16:9) |
| `size_spec` | JSONB | `{width, height}` in pixels |
| `dpi` | INTEGER | Resolution (default: 300) |
| `bleed_px` | INTEGER | Bleed in pixels |
| `safe_px` | INTEGER | Safe margin in pixels |
| `min_font_size` | INTEGER | Minimum font size |
| `brief` | TEXT | Creative brief |
| `copy` | TEXT | Ad copy text |
| `status` | ENUM | `draft`, `in_review`, `approved`, `exported` |
| `target_date` | DATE | Target publication date |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

#### `assets`
Uploaded images (products, logos).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ad_id` | UUID | FK to ads |
| `type` | ENUM | `product` or `logo` |
| `url` | TEXT | Public URL |
| `width` | INTEGER | Image width |
| `height` | INTEGER | Image height |
| `name` | TEXT | File name |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `versions`
Ad layout versions (AI-generated or manual).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ad_id` | UUID | FK to ads |
| `source` | ENUM | `ai` or `manual` |
| `layout_json` | JSONB | Layout specification |
| `preview_url` | TEXT | Preview image URL |
| `is_selected` | BOOLEAN | Currently selected version |
| `image_transform` | JSONB | `{x, y, scale}` transform |
| `status` | TEXT | `pending`, `kept`, `discarded` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `comments`
Comments on ads.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ad_id` | UUID | FK to ads |
| `author` | TEXT | Author name |
| `message` | TEXT | Comment text |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `review_tokens`
Secure tokens for client review links.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `ad_id` | UUID | FK to ads |
| `token` | TEXT | Unique token string |
| `client_email` | TEXT | Client email |
| `client_name` | TEXT | Client name |
| `expires_at` | TIMESTAMPTZ | Token expiration |
| `used_at` | TIMESTAMPTZ | When token was used |
| `response` | TEXT | `approved` or `changes_requested` |
| `feedback` | TEXT | Client feedback |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `notifications`
User notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `type` | TEXT | Notification type |
| `title` | TEXT | Notification title |
| `message` | TEXT | Notification message |
| `ad_id` | UUID | Related ad (optional) |
| `metadata` | JSONB | Additional data |
| `read_at` | TIMESTAMPTZ | When read |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

#### `user_profiles`
User profile and role information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (FK to auth.users) |
| `email` | TEXT | User email |
| `full_name` | TEXT | User's full name |
| `role` | TEXT | `user`, `manager`, or `admin` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### Enums

```sql
ad_status: 'draft' | 'in_review' | 'approved' | 'exported'
asset_type: 'product' | 'logo'
version_source: 'ai' | 'manual'
```

### Row Level Security (RLS)

All tables have RLS enabled with policies based on:
- **User ownership**: Users can only access their own ads and related data
- **Public access**: Publications are readable by all authenticated users
- **Storage**: Authenticated users can upload; anyone can view assets

---

## Authentication

Authentication is handled via **Supabase Auth** with email/password.

### AuthProvider (`src/hooks/useAuth.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;           // 'user' | 'manager' | 'admin'
  profile: UserProfile | null;
  isManager: boolean;       // true if role is 'manager' or 'admin'
  isAdmin: boolean;         // true if role is 'admin'
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
```

### User Roles

The app supports role-based access control:

| Role | Description | Access |
|------|-------------|--------|
| `user` | Standard user | Own ads only |
| `manager` | Team manager | All ads, team dashboard |
| `admin` | Administrator | Full access |

### Usage

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, loading, isManager, role } = useAuth();
  
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/auth" />;
  
  // Role-based rendering
  if (isManager) {
    return <ManagerDashboard />;
  }
  
  return <Dashboard />;
}
```

---

## AI Integration

### Provider Context (`src/integrations/ai/`)

The app uses Gemini as the sole AI provider.

```typescript
type AiProviderType = 'gemini';

interface AiContextValue {
  provider: AiProviderType;
  setProvider: (p: AiProviderType) => void;
}
```

### Usage

```tsx
import { useAi } from '@/integrations/ai/context';

function MyComponent() {
  const { provider } = useAi(); // Always 'gemini'
  // ...
}
```

---

## Supabase Edge Functions

### `generate-layouts`

Primary function for AI-powered ad image generation.

**Location**: `supabase/functions/generate-layouts/index.ts`

**Request Payload**:
```typescript
interface GenerateRequest {
  adId: string;
  adName?: string;
  clientName?: string;
  sizeSpec: { width: number; height: number };
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  dpi: number;
  bleedPx: number;
  safePx: number;
  minFontSize: number;
  copy: string;
  brief: string;
  assets: AssetMeta[];
  provider?: 'gemini';
  numOptions?: number;
  regenerationPrompt?: string;      // Routes to regeneration webhook
  bigChangesPrompt?: string;        // Routes to big changes webhook
  referenceImageUrl?: string;
}
```

**Behavior**:

1. **Standard Generation** (no special prompts):
   - OpenAI: Direct API call to `gpt-image-1`
   - Gemini: Routes to `N8N_GEMINI_WEBHOOK_URL`

2. **Regeneration** (`regenerationPrompt` provided):
   - Routes to `N8N_REGENERATION_WEBHOOK_URL`

3. **Big Changes** (`bigChangesPrompt` provided):
   - Routes to `N8N_BIG_CHANGES_WEBHOOK_URL`

**Response**:
```typescript
{
  success: boolean;
  imageUrl: string;
  imageUrls: string[];
  count: number;
  description: string;
}
```

**Required Secrets**:
- `PROJECT_URL` or `SUPABASE_URL`
- `SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (for OpenAI provider)
- `N8N_GEMINI_WEBHOOK_URL` (for Gemini provider)
- `N8N_REGENERATION_WEBHOOK_URL` (for regeneration)
- `N8N_BIG_CHANGES_WEBHOOK_URL` (for big changes)

---

## Frontend Components

### UI Components (shadcn/ui)

The project includes 49 pre-built shadcn/ui components in `src/components/ui/`:

- **Layout**: `card`, `separator`, `scroll-area`, `resizable`, `sidebar`
- **Forms**: `input`, `textarea`, `select`, `checkbox`, `radio-group`, `switch`, `slider`, `form`, `label`
- **Feedback**: `alert`, `alert-dialog`, `dialog`, `drawer`, `sheet`, `toast`, `sonner`, `progress`, `skeleton`
- **Navigation**: `tabs`, `accordion`, `collapsible`, `navigation-menu`, `menubar`, `breadcrumb`, `pagination`
- **Data Display**: `table`, `avatar`, `badge`, `calendar`, `carousel`, `chart`, `hover-card`, `tooltip`
- **Overlays**: `popover`, `dropdown-menu`, `context-menu`, `command`
- **Actions**: `button`, `toggle`, `toggle-group`

### Custom Components

| Directory | Purpose |
|-----------|---------|
| `components/ads/` | Ad card, ad list components |
| `components/ai/` | AI provider selector, generation UI |
| `components/editor/` | Canvas, toolbar, layer controls |
| `components/layout/` | Page layouts, navigation |
| `components/notifications/` | Notification bell, list |
| `components/review/` | Review form, status display |

---

## Type Definitions

### Ad Types (`src/types/ad.ts`)

```typescript
interface Ad {
  id: string;
  user_id: string;
  client_name: string;
  ad_name: string | null;
  publication_id: string | null;
  publication_issue: string | null;
  ad_size_id: string | null;
  aspect_ratio: AspectRatio | null;
  size_spec: SizeSpec;
  dpi: number;
  bleed_px: number | null;
  safe_px: number | null;
  min_font_size: number | null;
  brief: string | null;
  copy: string | null;
  status: 'draft' | 'in_review' | 'approved' | 'exported';
  target_date: string | null;
  created_at: string;
  updated_at: string;
  publications?: Publication;
  publication_issues?: PublicationIssue;
  ad_sizes?: AdSize;
  selected_version_preview?: string | null;
}

interface Version {
  id: string;
  ad_id: string;
  source: 'ai' | 'manual';
  layout_json: LayoutJSON;
  preview_url: string | null;
  is_selected: boolean;
  image_transform: ImageTransform | null;
  status: 'pending' | 'kept' | 'discarded';
  created_at: string;
}

interface LayoutJSON {
  document: LayoutDocument;
  elements: LayoutElement[];
  metadata: {
    templateName: string;
    rationale: string;
    warnings: string[];
  };
}

interface LayoutElement {
  type: 'text' | 'image' | 'shape';
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style?: { /* font, color, alignment, etc. */ };
  content?: string;
  assetRef?: string;
}
```

### Review Types (`src/types/review.ts`)

```typescript
interface ReviewToken {
  id: string;
  ad_id: string;
  token: string;
  client_email: string;
  client_name: string | null;
  expires_at: string;
  used_at: string | null;
  response: 'approved' | 'changes_requested' | null;
  feedback: string | null;
  created_at: string;
}

interface ReviewResponse {
  response: 'approved' | 'changes_requested';
  feedback?: string;
}
```

### Notification Types (`src/types/notification.ts`)

```typescript
type NotificationType = 
  | 'review_approved' 
  | 'review_changes_requested' 
  | 'ad_generated' 
  | 'system';

interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  ad_id: string | null;
  metadata: Record<string, any>;
  read_at: string | null;
  created_at: string;
}
```

---

## API & Data Layer

### Database Adapter Pattern

The app uses an adapter pattern for database operations, allowing potential future database swaps.

**Interface** (`src/integrations/db/adapter.ts`):

```typescript
interface DbAdapter {
  // Ads
  fetchAds(): Promise<Ad[]>;
  fetchAdsByPublicationIssue(issueId: string): Promise<Ad[]>;
  fetchAdWithPublication(id: string): Promise<{ ad: Ad; publication: Publication | null }>;
  createAd(input: CreateAdInput): Promise<Ad>;
  updateAdStatus(adId: string, status: Ad['status']): Promise<void>;
  updateAdSpecs(adId: string, specs: UpdateAdSpecsInput): Promise<void>;
  
  // Assets
  fetchAssetsByAdId(adId: string): Promise<Asset[]>;
  uploadAsset(adId: string, file: File, type: Asset['type']): Promise<Asset>;
  
  // Versions
  fetchVersionsByAdId(adId: string): Promise<Version[]>;
  setSelectedVersion(adId: string, versionId: string): Promise<void>;
  updateVersionTransform(versionId: string, transform: ImageTransform): Promise<void>;
  updateVersionStatus(versionId: string, status: string): Promise<void>;
  createVersionFromBlob(adId: string, blob: Blob, source?: 'ai' | 'manual'): Promise<Version>;
  createVersionFromUrl(adId: string, imageUrl: string, source?: 'ai' | 'manual'): Promise<Version>;
  
  // Reference Data
  fetchAdSizes(): Promise<AdSize[]>;
  fetchClients(): Promise<Client[]>;
  fetchPublications(): Promise<Publication[]>;
  fetchPublicationsByClient(clientId: string): Promise<Publication[]>;
  fetchPublicationIssues(publicationId: string): Promise<PublicationIssue[]>;
  fetchAllUpcomingIssues(): Promise<PublicationIssue[]>;
  
  // AI Generation
  invokeGenerateLayouts(payload: GenerateLayoutsPayload): Promise<{ data: any; error: any }>;
  
  // Reviews
  createReviewToken(input: CreateReviewTokenInput): Promise<ReviewToken>;
  fetchReviewTokenByToken(token: string): Promise<ReviewToken | null>;
  fetchReviewTokensByAdId(adId: string): Promise<ReviewToken[]>;
  submitReviewResponse(token: string, response: ReviewResponse): Promise<void>;
  
  // Notifications
  fetchNotifications(userId: string): Promise<Notification[]>;
  fetchUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  createNotification(input: CreateNotificationInput): Promise<Notification>;
}
```

**Implementation**: `src/integrations/db/providers/supabaseAdapter.ts`

---

## Environment Variables

### Frontend (Vite)

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### Supabase Edge Functions (Secrets)

Set these via Supabase Dashboard or CLI:

```bash
# Required
PROJECT_URL=https://your-project.supabase.co
SERVICE_ROLE_KEY=your-service-role-key

# n8n Webhooks (Gemini AI)
N8N_GEMINI_WEBHOOK_URL=https://your-n8n-instance/webhook/...
N8N_REGENERATION_WEBHOOK_URL=https://your-n8n-instance/webhook/...
N8N_BIG_CHANGES_WEBHOOK_URL=https://your-n8n-instance/webhook/...
```

---

## Deployment

### Render (Static Site)

The app is configured for deployment on Render as a static site.

**Build Settings**:
- **Build Command**: `npm ci && npm run build`
- **Publish Directory**: `dist`
- **SPA Routing**: Rewrite `/*` to `/index.html`

**Environment Variables** (set in Render dashboard):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Blueprint Deployment

A `render.yaml` file is included for automatic Blueprint deployment.

### Supabase Setup

1. Create a Supabase project
2. Run migrations: `supabase db push`
3. Deploy edge functions: `supabase functions deploy`
4. Set function secrets via dashboard or CLI
5. Configure storage bucket policies

---

## Development Guide

### Prerequisites

- Node.js (LTS version)
- npm, pnpm, or bun
- Supabase CLI (optional, for local development)

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Local Supabase Development

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Deploy functions locally
supabase functions serve

# Generate types from database
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### Updating Database Types

After schema changes:

1. Update migrations in `supabase/migrations/`
2. Run `supabase db push` to apply changes
3. Regenerate types: `supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`
4. Update `supabaseAdapter.ts` if query mappings change

### Adding New Features

1. **Database changes**: Create migration, update types
2. **API methods**: Add to `DbAdapter` interface and `SupabaseDbAdapter`
3. **UI components**: Add to appropriate `src/components/` subdirectory
4. **Pages**: Add to `src/pages/` and update routes in `App.tsx`
5. **Types**: Define in `src/types/`

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## License

Private project - all rights reserved.
