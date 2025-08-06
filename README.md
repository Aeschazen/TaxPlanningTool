# Tax Planning Tool

A tax planning application built with React, TypeScript, and Vite.

## Overview

This tool provides an interactive interface for calculating various types of income taxes, deductions, and tax liabilities. It supports multiple income sources including salaries, commissions, royalties, yield income, rental income, and more.

## Features

- **Multiple Income Types**
  - Salary & Commission Income
  - Royalty Income
  - Yield Income (Dividends, Interest, etc.)
  - Rental Income
  - Other Income Sources

- **Tax Deductions**
  - Familial Tax Deduction
  - Retirement Contributions
  - Insurance Premiums
  - Donations
  - Other Deductible Expenses

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite development server with Hot Module Replacement (HMR) enabled.

### Build

```bash
npm run build
```

Builds the application for production to the `dist` directory.

### Preview

```bash
npm run preview
```

Preview the production build locally before deployment.

### Linting

```bash
npm run lint
```

Runs ESLint to check code quality.

## Project Structure

```
src/
├── App.tsx                 # Main application component
├── App.css                 # Global styles
├── main.tsx                # Entry point
├── domains/
│   └── Tax/
│       ├── Hooks.tsx       # Custom React hooks for tax calculations
│       └── Components/
│           ├── Sections.tsx       # Tax section components
│           └── Explanations.tsx    # Explanation of the calculation components
├── shared/
│   ├── Components.tsx      # Reusable UI components
│   ├── Constants.ts        # Application constants
│   └── Utils.ts            # Utility functions
└── assets/                 # Static assets
```

## Key Components

- **Tax Sections**: Income, deductions, and calculation sections
- **Hooks**: Custom hooks managing tax calculation logic and state
- **Shared Components**: Reusable components like `PercentageDisplay`, `MoneyDisplay`, and `Modal`

## License

Private project
