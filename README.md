# guarantorLens_mission_capstone_FE

Frontend for **GuarantorLens** — explainable, network-aware loan-default risk decision support for a savings and credit cooperative (ALU final-year mission capstone).
Built with [React](https://react.dev), [TypeScript](https://www.typescriptlang.org), [Vite](https://vitejs.dev), and [Tailwind CSS](https://tailwindcss.com). Deployed on [Vercel](https://vercel.com).

🔗 **Live demo:** https://guarantor-lens-mission-capstone-fe.vercel.app/
🔗 **Backend API + model:** https://github.com/Best-Verie/guarantorLens_mission_capstone_BE (Swagger docs at `/docs`)

> This app talks to the FastAPI backend. Set `VITE_API_URL` to the backend base URL (see below).

---

## Tech Stack

- **React** — UI library
- **Vite** — build tool & dev server
- **Tailwind CSS** — utility-first styling
- **Vercel** — hosting & deployment

---

## Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org) (v18 or higher recommended)
- npm (comes with Node) — or use `pnpm` / `yarn` if you prefer

Check your versions:

```bash
node -v
npm -v
```

---

## Running Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/Best-Verie/guarantorLens_mission_capstone_FE.git
   cd guarantorLens_mission_capstone_FE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   > Note: With Vite, client-side env variables **must** be prefixed with `VITE_` (e.g. `VITE_API_URL`).

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at **http://localhost:5173**.

---

## Available Scripts

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Start the local development server               |
| `npm run build`   | Build the app for production (outputs to `dist/`)|
| `npm run preview` | Preview the production build locally             |
| `npm run lint`    | Run the linter (if configured)                   |

---

## Project Structure

```
.
├── public/             # Static assets served as-is
├── src/
│   ├── api/            # Typed API clients (risk, members, applications, insights)
│   ├── components/     # Reusable React components
│   ├── pages/          # Page-level components (AssessRisk, ApplicationDetail, Member, ...)
│   ├── lib/            # Session/auth helpers
│   ├── App.tsx         # Root component & routes
│   ├── main.tsx        # App entry point
│   └── index.css       # Tailwind directives & global styles
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
└── package.json
```

---

## Environment Variables

| Variable        | Description                  | Required |
| --------------- | ---------------------------- | -------- |
| `VITE_API_URL`  | Base URL for the backend API | Yes      |


---

## Deployment (Vercel)

This project is deployed automatically on Vercel.

- **Production:** every push to the `main` branch triggers a production deploy.
- **Preview:** every pull request gets its own preview deployment.

### First-time setup

1. Import the repository into [Vercel](https://vercel.com/new).
2. Vercel auto-detects Vite — settings should be:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add your environment variables under **Project Settings → Environment Variables**.
4. Click **Deploy**.

### Manual deploy via CLI (optional)

```bash
npm i -g vercel
vercel          # deploy a preview
vercel --prod   # deploy to production
```


## License

[MIT](LICENSE) © Best Verie
