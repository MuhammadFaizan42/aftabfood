# Deployment Guide – GitHub + Hostinger

## 1. GitHub pe push karna

### Pehli baar (agar repo abhi create nahi kiya)

```bash
git init
git add .
git commit -m "Initial commit - Aftab Food Sale App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### Baad mein (changes push)

```bash
git add .
git commit -m "Your message"
git push origin main
```

### Important

- **`.env` / `.env.local` commit mat karo** – ye already `.gitignore` mein hain.
- Hostinger pe deploy ke baad wahan **Environment Variables** set karo (see below).

---

## 2. Hostinger pe deploy karna

Hostinger pe Next.js app chalane ke liye **Node.js support** chahiye (VPS ya Node.js hosting).

### Step 1: Node version

- Hostinger pe **Node.js 18** ya **20** select karo (Apps → Node.js).
- `package.json` mein `engines.node` set hai: `>=18.0.0`.

### Step 2: Repo clone / connect

- **Option A – Manual:** SSH se connect karke repo clone karo:
  ```bash
  cd domains/yourdomain.com
  git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git .
  ```
- **Option B – GitHub integration:** Hostinger panel se “Git” / “Deploy from GitHub” use karke repo connect karo (agar available ho).

### Step 3: Install + build

```bash
npm ci
npm run build
```

Agar `npm ci` fail kare to:

```bash
npm install
npm run build
```

### Step 4: Environment variables (Hostinger panel)

Hostinger pe project ke **Environment Variables** / **.env** mein ye set karo:

| Variable | Example | Zaroori? |
|----------|---------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.otwoostores.com/restful` | Optional (default same hai) |

Agar aap API URL change karna chahte ho to yahi use karo.

### Step 5: App start (production)

```bash
npm run start
```

Ye `next start` chalata hai (port 3000 by default). Hostinger agar **PORT** env set kare to Next.js usi port pe sunega.

### Step 6: Process always run (PM2 – agar SSH access ho)

```bash
npm install -g pm2
pm2 start npm --name "aftabfood" -- start
pm2 save
pm2 startup
```

---

## 3. Build errors agar aaye

- **Node version:** `node -v` se check karo – 18+ hona chahiye.
- **Memory:** Build ke waqt memory kam ho to Hostinger pe Node memory limit badha sakte ho ya `NODE_OPTIONS=--max-old-space-size=4096 npm run build` use karo.
- **Path / case:** Windows se push kiya ho to path case (upper/lower) ka issue Linux pe aa sakta hai – filenames consistent rakho.

---

## 4. Checklist

- [ ] `.env.local` commit nahi hua (`.gitignore` check)
- [ ] GitHub pe repo push ho chuka
- [ ] Hostinger pe Node 18+ set
- [ ] `npm ci` / `npm run build` success
- [ ] `NEXT_PUBLIC_API_BASE_URL` (agar zaroor ho) Hostinger env mein set
- [ ] `npm run start` ya PM2 se app chal rahi hai
- [ ] Domain / subdomain Hostinger pe is app ki taraf point ho (e.g. port 3000 / reverse proxy)

---

## 5. Optional – Standalone build (chota deploy)

Agar aap chaho ke deploy folder chota ho to `next.config.ts` mein ye add karo:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  // ... rest
};
```

Phir build ke baad:

- `.next/standalone` folder use karo
- `public` aur `.next/static` is folder ke andar copy karo
- `node .next/standalone/server.js` se run karo (project root se)

Is case mein `npm run start` use mat karo; sirf standalone server chalana hoga.
