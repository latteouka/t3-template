---
**Created:** 2026-05-02
**Status:** Approved
**Topic:** shadcn/ui 整合至 t3-template
---

# shadcn/ui 整合至 t3-template — 設計文件

## 背景與目標

`t3-template` 目前只有 Tailwind v4 安裝，沒有 UI component library。專案定位是「直接拿來開發新案的 starter」，且使用者全域 `~/CLAUDE.md` 規範要求「ALWAYS use shadcn/ui components instead of raw HTML elements」。本任務將 shadcn/ui 整合進 template，並建立 Claude Code 在 clone 後能自動辨識「shadcn 已 ready」的信號。

## 需求對齊（brainstorming 結論）

| # | 決策點 | 結論 |
|---|--------|------|
| Q1 | 角色定位 | B — 直接當現役專案開發起點 |
| Q2 | 預裝範圍 | C — 完整包 21 個元件 |
| Q3 | Base color | Zinc |
| Q4 | page.tsx 處理 | B — 重做為最小 smoke test |

額外確認：要讓 Claude Code 接手新案時直接知道 shadcn 可用 → 透過 root `CLAUDE.md` + `src/components/ui/CLAUDE.md` + 檔案結構雙重信號。

## 預裝元件清單（21）

Button、Input、Label、Form、Dialog、AlertDialog、Sonner（toast）、Card、DropdownMenu、Select、Table、Tabs、Tooltip、Sheet、Avatar、Badge、Skeleton、Separator、Popover、Checkbox、Switch

## 安裝機制

使用 shadcn 官方 CLI，**不**手動複製：

```bash
pnpm dlx shadcn@latest init        # 一次設定 base=zinc, style=new-york, icon=lucide
pnpm dlx shadcn@latest add <list>  # 一次帶入 21 個元件
```

理由：CLI 自動處理 Tailwind v4 的 `tw-animate-css`、Radix peer 版本、`globals.css` 的 `@theme inline` 區塊；手動易漏。

## 整合後檔案結構

```
t3-template/
├── components.json                    ★ 新增 (shadcn 設定)
├── CLAUDE.md                          ★ 新增 (root — shadcn ready 信號)
├── docs/superpowers/specs/            (本文件所在)
├── src/
│   ├── app/
│   │   ├── _components/
│   │   │   └── toast-trigger.tsx      ★ 新增 (smoke test 用 client component)
│   │   ├── layout.tsx                 ✎ 修改 (掛 Toaster + body className)
│   │   └── page.tsx                   ✎ 重做 (最小 smoke test)
│   ├── components/
│   │   ├── CLAUDE.md                  ★ 新增 (邊界宣告)
│   │   └── ui/                        ★ 新增資料夾
│   │       ├── CLAUDE.md              ★ 新增 (元件清單 + 注意事項)
│   │       └── *.tsx                  ★ 21 個 shadcn 元件
│   ├── lib/
│   │   └── utils.ts                   ★ 新增 (cn() helper)
│   └── styles/
│       └── globals.css                ✎ 擴充 (@theme inline + Zinc tokens)
```

## 新增依賴

**Runtime（dependencies）：**

- 工具：`class-variance-authority`、`clsx`、`tailwind-merge`、`tw-animate-css`、`lucide-react`
- 表單：`react-hook-form`、`@hookform/resolvers`（`zod` 已存在）
- Radix primitives：單一 `radix-ui` umbrella package（內含 label、slot、dialog、alert-dialog、dropdown-menu、select、tabs、tooltip、avatar、separator、popover、checkbox、switch 等 sub-modules）。modern shadcn 不再裝散裝 `@radix-ui/react-*`
- Toast：`sonner`
- 其他：`cmdk`（若 CLI 帶入，視 shadcn CLI 版本）

**Dev（devDependencies）：** 無新增

預估影響：runtime deps 13 → ~32，`node_modules` 增加約 1.5–2 MB（gzipped）。

## 三層 CLAUDE.md 內容

### `/CLAUDE.md`（root）

```markdown
# t3-template

T3 Stack starter with shadcn/ui pre-installed.

## UI: shadcn/ui (ready)

- Components: `src/components/ui/` — 21 元件預裝（Button、Input、Form、Dialog、AlertDialog、Sonner toast 等）
- Add more: `pnpm dlx shadcn@latest add <name>` — 不要手寫
- Base color: zinc / Style: new-york / Icons: lucide-react
- 完整清單與用法見 `src/components/ui/CLAUDE.md`

## Stack
Next.js 16 (Turbopack) · React 19 · TypeScript strict · Tailwind v4 · tRPC · Prisma 7 · better-auth

## Common commands
- pnpm dev / pnpm build / pnpm typecheck / pnpm lint
```

### `src/components/CLAUDE.md`

```markdown
# components/

- `ui/` — shadcn/ui primitives（不要手改、不要新增非 shadcn 內容）
- `<feature>/` — 應用層複合元件，可自由組合 ui/ primitives
```

### `src/components/ui/CLAUDE.md`

```markdown
# components/ui — shadcn/ui

Base: zinc · Style: new-york · Icons: lucide-react

## Pre-installed (21)

Button · Input · Label · Form · Dialog · AlertDialog · Sonner (toast) ·
Card · DropdownMenu · Select · Table · Tabs · Tooltip · Sheet · Avatar ·
Badge · Skeleton · Separator · Popover · Checkbox · Switch

## Add more
pnpm dlx shadcn@latest add <name>

## Notes
- AlertDialog 確認 dialog 的 E2E：第二次 click 必須 scope 到 `getByRole("alertdialog")`，不可用 `.last()` / `.nth(1)`
- Toast：`import { toast } from "sonner"`，Toaster 已掛在 root layout
- Form：搭 `react-hook-form` + `zod` + `@hookform/resolvers` 三件套（皆已隨 Form 元件預裝）
- 不要用原生 `<button>` / `alert()` / `confirm()` — 一律用 shadcn primitive
```

## layout.tsx 修改

```tsx
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "My App",
  description: "",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster />
      </body>
    </html>
  );
}
```

四處改動：
1. `<Toaster />` 掛在 body 末端（sonner 自帶 `'use client'`）
2. body 加 `bg-background text-foreground` 接 shadcn CSS variables
3. body 加 `font-sans antialiased` 修順手 bug — 既存 layout 宣告 Geist variable 但沒套用
4. html 加 `suppressHydrationWarning` 為未來 dark mode 預留

## page.tsx 重做

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ToastTrigger } from "./_components/toast-trigger";
import { api, HydrateClient } from "@/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  return (
    <HydrateClient>
      <main className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>T3 Stack + shadcn/ui</CardTitle>
            <CardDescription>{hello.greeting}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <ToastTrigger />
            <Button variant="outline" asChild>
              <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">shadcn docs</a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </HydrateClient>
  );
}
```

## `src/app/_components/toast-trigger.tsx`（新增）

```tsx
"use client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ToastTrigger() {
  return <Button onClick={() => toast.success("shadcn 工作正常")}>測試 toast</Button>;
}
```

抽出 client 邊界的理由：`page.tsx` 維持 server component（保留 `api.post.hello` server-side 呼叫），符合 user CLAUDE.md「Server Components by default」原則。

## 同時驗證的 6 件事（page.tsx smoke test）

1. Card 系列元件渲染 → CSS variables 正確載入
2. Button 兩種 variant（default + outline）
3. Button 的 `asChild` polymorphism（包 `<a>`）
4. Geist 字型實際套用到 body
5. Sonner Toaster 全域可用、toast() 觸發正常
6. tRPC server-side `api.post.hello` 沒被破壞

## 已知坑與處理

| # | 坑 | 處理 |
|---|-----|------|
| 1 | `verbatimModuleSyntax: true` × shadcn CLI 偶生 `import { type X }` | 21 個 add 完跑 `pnpm build`，有錯改寫成 `import type { X }`（memory: `feedback_turbopack_type_imports.md`） |
| 2 | Tailwind v4 用 `tw-animate-css` 不是 `tailwindcss-animate` | 確認 CLI 在 `globals.css` 寫入 `@import "tw-animate-css";`，沒寫手動補 |
| 3 | 既有 `@theme { --font-sans }` 不能被 CLI 併掉 | init 後檢查 `globals.css`，保留兩塊 `@theme` 共存 |
| 4 | Next 16 自動改 `tsconfig.json` | `git status` 出現 tsconfig diff（如 `.next/dev/types`）不要 commit（memory: `project_next16_tsconfig_mutation.md`） |
| 5 | dev server 改 `next-env.d.ts` | 收尾 `git checkout -- next-env.d.ts`（user CLAUDE.md pitfall #5） |

## 潛在風險（不一定踩）

- **Radix peer × React 19**：可能 peer warning，可接受，不要 downgrade
- **react-hook-form × React 19 transitions**：可能 act() warning，不影響功能
- **better-auth seed**：與本任務無關，不動 auth / seed

## 明確排除（NOT doing）

- ❌ Dark mode toggle / next-themes provider（`.dark` CSS variables 會有，但不裝切換 UI）
- ❌ Storybook / 元件 playground
- ❌ 測試 setup（vitest / playwright / RTL）
- ❌ CI workflow 改動
- ❌ Brand color / theme override（維持 zinc 純淨）
- ❌ Component customization（21 個維持 shadcn 出廠預設）

## 驗證 checklist（實作完成、commit 前）

```bash
pnpm typecheck     # verbatimModuleSyntax 檢查
pnpm lint          # ESLint
pnpm build         # Next 16 + Turbopack production build（抓 type-import 坑）
pnpm dev           # 手動點開 page.tsx，按按鈕看 toast
git status         # 確認沒 next-env.d.ts / tsconfig.json noise diff
```

## 成功標準

- ✅ 21 個元件存在於 `src/components/ui/` 且 typecheck 過
- ✅ `pnpm build` 在乾淨 clone 上成功
- ✅ `pnpm dev` 啟動後 `/` 頁面顯示 Card + 兩個 Button，按「測試 toast」出現 sonner toast
- ✅ 三份 CLAUDE.md 各就各位，內容如上述
- ✅ Git diff 不含 `next-env.d.ts` / `tsconfig.json` 的 noise

## 後續工作（不在本 spec scope）

- Dark mode toggle（可能後續另一個 spec）
- E2E 測試 setup（Playwright + 全套 pitfall 防範）
- Brand color override pattern（若未來新案有需要）
