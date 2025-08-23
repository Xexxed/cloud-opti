# Project Structure

## Root Level Organization
```
├── .git/                 # Git repository
├── .kiro/               # Kiro AI assistant configuration
├── .vscode/             # VS Code workspace settings
├── node_modules/        # Dependencies
├── public/              # Static assets
├── src/                 # Source code
├── package.json         # Project dependencies and scripts
├── next.config.mjs      # Next.js configuration
├── jsconfig.json        # JavaScript/TypeScript configuration
├── eslint.config.mjs    # ESLint configuration
├── postcss.config.mjs   # PostCSS configuration
└── README.md           # Project documentation
```

## Source Code Structure (`src/`)
- **`src/app/`** - Next.js App Router directory
  - `layout.js` - Root layout component
  - `page.js` - Home page component
  - `globals.css` - Global styles
  - `favicon.ico` - Site favicon
  - `analyze/` - Repository analysis pages
  - `estimate/` - Cost estimation interface
  - `results/` - Architecture recommendations display

- **`src/components/`** - Reusable UI components
  - `ui/` - Base UI components (buttons, inputs, cards)
  - `forms/` - Input forms (repo input, stack selection)
  - `diagrams/` - Architecture visualization components
  - `cost/` - Cost estimation and display components

- **`src/lib/`** - Core business logic
  - `github/` - GitHub API integration
  - `analysis/` - Code and stack analysis engines
  - `cloud/` - Cloud service recommendation logic
  - `cost/` - Cost calculation utilities
  - `terraform/` - IaC template generation
  - `diagrams/` - Diagram generation utilities

- **`src/data/`** - Static data and configurations
  - `services/` - Cloud service definitions and pricing
  - `templates/` - Terraform template snippets
  - `mappings/` - Technology to service mappings

## Static Assets (`public/`)
- SVG icons and graphics
- Publicly accessible files served from root

## Key Conventions
- **App Router**: Uses Next.js 13+ App Router pattern
- **Path Aliases**: `@/` prefix for imports from `src/` directory
- **File Extensions**: `.js` for React components, `.mjs` for config files
- **Styling**: Global CSS in `app/globals.css`, Tailwind for component styling
- **Components**: Place in `src/app/` following App Router conventions

## Import Patterns
```javascript
// Use path alias for internal imports
import Component from '@/components/Component'

// Standard relative imports for same directory
import './globals.css'
```