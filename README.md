# Snakey 3D World

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/seatayu/snakey-3d)

A modern full-stack web application built with React, Tailwind CSS, and shadcn/ui, powered by Cloudflare Workers for seamless edge deployment. Features a responsive UI with dark mode, sidebar navigation, and API routes handled via Hono.

## ✨ Features

- **React + Vite**: Fast development with hot module replacement and optimized builds.
- **shadcn/ui**: Beautiful, accessible UI components with Tailwind CSS.
- **Cloudflare Workers**: Serverless API routes with zero-cold-start architecture.
- **TypeScript**: Full type safety across frontend and backend.
- **Theme Support**: Light/dark mode with persistence.
- **Responsive Design**: Mobile-first layout with sidebar collapse.
- **State Management**: TanStack Query for data fetching and caching.
- **Error Handling**: Global error boundaries and client error reporting.
- **Animations**: Smooth transitions powered by Tailwind and Framer Motion.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS 3, shadcn/ui, Lucide Icons, React Router, TanStack Query, Sonner (toasts), Framer Motion
- **Backend**: Hono (routing), Cloudflare Workers & KV
- **UI/UX**: Radix UI primitives, Tailwind CSS Animate, clsx, tailwind-merge
- **Dev Tools**: Bun (package manager), ESLint, TypeScript ESLint
- **Deployment**: Cloudflare Wrangler, Pages (SPA assets)

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed (recommended package manager)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install/) (`bun add -g wrangler`)
- Cloudflare account with Workers enabled

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd snakey-3d-world-hu0v6t5nl8v9jql815jxs
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. (Optional) Generate Worker types:
   ```bash
   bun run cf-typegen
   ```

### Local Development

Start the development server:
```bash
bun dev
```

- Frontend: `http://localhost:3000`
- API routes: `http://localhost:3000/api/*`

Scripts:
- `bun dev`: Start dev server (Vite + Worker proxy)
- `bun build`: Build for production
- `bun lint`: Run ESLint
- `bun preview`: Preview production build

## 📚 Usage

### Frontend Development

- Edit `src/pages/HomePage.tsx` for the main app.
- Add routes in `src/main.tsx` using React Router.
- Use shadcn/ui components from `@/components/ui/*`.
- API calls: Use `fetch('/api/your-route')` – automatically proxied to Worker.

### Backend Development (API Routes)

- Add routes in `worker/userRoutes.ts` (e.g., `app.get('/api/test', ...)`).
- Access bindings via `Env` interface in `worker/core-utils.ts`.
- **Do not modify** `worker/index.ts` or `worker/core-utils.ts`.

Example API route:
```ts
// worker/userRoutes.ts
app.get('/api/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id, message: 'User found' });
});
```

### Customizing the UI

- Sidebar: Edit `src/components/app-sidebar.tsx`.
- Layout: Use `AppLayout` from `src/components/layout/AppLayout.tsx`.
- Theme: Toggle via `ThemeToggle` component.
- Styling: Extend `tailwind.config.js` and `src/index.css`.

## ☁️ Deployment

Deploy to Cloudflare Workers & Pages with one command:

```bash
bun deploy
```

This builds assets and deploys via Wrangler.

### Manual Deployment Steps

1. Login to Cloudflare:
   ```bash
   wrangler login
   ```

2. Build and deploy:
   ```bash
   bun build
   wrangler deploy
   ```

3. Configure custom domain (optional):
   Update `wrangler.jsonc` and run `wrangler deploy`.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/seatayu/snakey-3d)

**Note**: SPA assets are served from `/` with API routes at `/api/*`. Worker handles both.

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch (`bun dev`).
3. Commit changes (`bun lint`).
4. Open a Pull Request.

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

## 🙌 Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

Built with ❤️ for the Cloudflare ecosystem.