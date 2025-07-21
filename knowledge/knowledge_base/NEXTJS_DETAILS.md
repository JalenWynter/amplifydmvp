# Next.js Details

This document outlines the key aspects of the Next.js framework used in the Amplifyd application.

## Version
- Next.js: `15.3.3` (as per `package.json`)

## App Router
- The application utilizes the Next.js App Router (`src/app` directory) for routing, layouts, and server components.
- **Layouts**: Shared UI across routes (e.g., `src/app/dashboard/layout.tsx`).
- **Pages**: UI unique to a route (e.g., `src/app/dashboard/profile/page.tsx`).

## Server Components and Client Components
- **Server Components**: Default behavior in the App Router. Rendered on the server, reducing client-side JavaScript bundle size and improving initial page load performance.
- **Client Components**: Opted into using the `'use client'` directive at the top of the file. These components run in the browser and are used for interactivity, state management, and browser-specific APIs.
- **Data Fetching**: Data fetching can occur on both server and client components, leveraging Firebase SDKs.

## API Routes
- Located in `src/app/api/`.
- Used for creating backend endpoints within the Next.js application.
- Primarily used for handling webhooks (e.g., Stripe webhooks) and other server-side logic that needs to be exposed as an API endpoint.

## Environment Variables
- Managed via `.env.local` for local development and system environment variables for production.
- `NEXT_PUBLIC_` prefix is used for variables exposed to the client-side bundle.
- Critical for configuring Firebase API keys, Stripe keys, and emulator hosts.

## Styling
- **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
- **ShadCN UI**: A collection of reusable components built with Radix UI and Tailwind CSS, providing accessible and customizable UI elements.

## Build and Development
- **Development Server**: `npm run dev` starts the Next.js development server, typically on port `9002`.
- **Production Build**: `npm run build` compiles the Next.js application for production deployment, generating optimized assets in the `.next` directory.
- **Turbopack**: Used for faster development builds (`--turbopack` flag in `dev` script).

## Key Features Leveraging Next.js
- **File-system based routing**: Simplifies route creation and management.
- **Server-Side Rendering (SSR)**: Improves SEO and initial load performance for dynamic content.
- **API Routes**: Enables building a full-stack application within a single Next.js project.
- **Optimized Image Handling**: Next.js `Image` component for performance.
- **Environment Variable Management**: Secure handling of sensitive keys.

This setup provides a modern, performant, and scalable foundation for the Amplifyd web application.
