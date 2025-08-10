# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Project Structure

### Component Libraries

This project uses a **hybrid component architecture** with multiple component libraries:

1. **`src/components/ui/`** - Standard shadcn/ui components
   - Basic Radix UI wrappers with Tailwind CSS styling
   - No animations or advanced features
   - Use for simple, static components

2. **`src/components/animate-ui/`** - Enhanced animated components
   - Extended versions with motion animations
   - Additional features like hover effects, transitions
   - More complex state management
   - Use for interactive, animated components

3. **`src/components/parts/`** - Application-specific components
   - Composite components built from UI primitives
   - Business logic and application-specific functionality
   - Reusable across the application

### Component Usage Guidelines

#### When to Use Each Component Library

**Use `@/components/ui/` for:**
- Basic form elements (inputs, buttons, labels)
- Simple layout components (cards, separators)
- Static UI elements
- When you need minimal styling and no animations

**Use `@/components/animate-ui/` for:**
- Interactive components (dropdowns, modals, sidebars)
- Components that need animations or transitions
- Complex state management
- When you need enhanced user experience

**Use `@/components/parts/` for:**
- Application-specific composite components
- Components that combine multiple UI primitives
- Business logic components
- Reusable application patterns

#### Import Patterns

Always use absolute imports with the `@/` prefix:

```typescript
// ✅ Correct
import { Button } from "@/components/ui/button"
import { RippleButton } from "@/components/animate-ui/buttons/ripple"
import { LoginForm } from "@/components/parts/login-form"

// ❌ Incorrect
import { Button } from "../ui/button"
import { RippleButton } from "../../animate-ui/buttons/ripple"
```

#### React Import Pattern

Use named imports for React:

```typescript
// ✅ Correct
import * as React from "react"

// ❌ Incorrect
import React from "react"
```

### File Naming Conventions

- Use kebab-case for file names: `data-column-header.tsx`
- Use PascalCase for component names: `DataTableColumnHeader`
- Use camelCase for function names: `handleSubmit`

### Component Organization

```
src/components/
├── ui/                    # Standard shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── animate-ui/           # Enhanced animated components
│   ├── radix/
│   ├── buttons/
│   └── ...
└── parts/               # Application-specific components
    ├── forms/           # Form components
    ├── navigation/      # Navigation components
    └── ...
```

## Development

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
