# Technology Stack

## Core Framework
- **Next.js 15.4.7** - React framework with App Router
- **React 19.1.0** - Latest React with concurrent features
- **React DOM 19.1.0** - React DOM renderer

## Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **PostCSS** - CSS processing with Tailwind plugin
- **Geist Font** - Vercel's optimized font family

## Development Tools
- **ESLint** - Code linting with Next.js core web vitals config
- **Turbopack** - Fast bundler for development mode

## Common Commands

### Development
```bash
npm run dev          # Start development server with Turbopack
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint checks
```

## Configuration Notes
- Uses ES modules (`.mjs` files) for configuration
- Path aliases configured: `@/*` maps to `./src/*`
- ESLint extends `next/core-web-vitals` for optimal performance
- PostCSS configured specifically for Tailwind CSS v4