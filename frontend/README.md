This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## NebulaCode Additions (Day 1)

### Local Setup

1. Install dependencies
	```bash
	npm install
	```
2. Copy `.env.local.example` to `.env.local` and update `NEXT_PUBLIC_API_URL` if your backend runs on a different host.
3. Start the dev server with `npm run dev` and visit `http://localhost:3000/editor` to open the IDE shell.

### Editor Architecture

- `components/editor/EditorPane.tsx` fetches a file (placeholder for now) and feeds the Monaco instance.
- `components/editor/EditorPane.tsx` fetches real file content from the backend (via `getFile`) and renders loading/error states while Monaco updates.
- `components/editor/MonacoEditor.tsx` wraps `@monaco-editor/react` and handles theming/styling.
- `types/editor.ts` declares shared `FileEntity` and `Workspace` interfaces.
- `lib/api/httpClient.ts` centralizes Axios with `NEXT_PUBLIC_API_URL` fallback to `http://localhost:4000`.
- `lib/api/files.ts` exports `getFile(workspaceId, fileId)` so the editor can request file contents once the backend endpoint is ready.

### Environment Reference

`frontend/.env.local.example` documents the required `NEXT_PUBLIC_API_URL` variable to keep local dev consistent.
