# BitCurrent Frontend

Modern, responsive trading interface built with Next.js 14 and React.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **UI Library**: React 18
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Charts**: Lightweight Charts (TradingView)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── trade/             # Trading interface
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── trading/          # Trading-specific components
│   └── shared/           # Shared components
├── lib/                  # Utilities and helpers
│   ├── api/             # API client
│   ├── hooks/           # Custom React hooks
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## Key Features

### Trading Interface
- Real-time orderbook with WebSocket updates
- Interactive price charts (TradingView)
- Advanced order placement (Market, Limit, Stop orders)
- Order history and trade history
- Portfolio overview

### Authentication
- Email/password login
- Two-factor authentication (2FA)
- Password recovery
- Session management

### Account Management
- Profile settings
- KYC document upload
- API key management
- Security settings

## Development

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting
npm run format

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## Building for Production

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
NEXT_PUBLIC_ENVIRONMENT=development
```

## Components

### LiveOrderbook
Real-time orderbook component with depth visualization.

### TradingChart
Interactive price chart with technical indicators.

### OrderForm
Order placement form with validation and balance display.

## Styling

Using Tailwind CSS with custom configuration and shadcn/ui components for consistent design.

## Performance

- Next.js Image optimization
- Code splitting
- Route prefetching
- Memoization of expensive computations
- Virtualized lists for large datasets

## Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader support
- High contrast mode



# Trigger redeploy after root directory fix
