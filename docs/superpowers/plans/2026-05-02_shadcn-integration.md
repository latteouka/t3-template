# shadcn/ui Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 shadcn/ui（21 個元件、Zinc base、new-york style）整合進 t3-template，並建立 Claude Code 可自動辨識「shadcn 已 ready」的三層 CLAUDE.md 信號。

**Architecture:** 使用 shadcn 官方 CLI 安裝（`pnpm dlx shadcn@latest init` + 一次性 `add` 21 個元件），不手動複製。以 `src/app/page.tsx` 重做為 Card-based 最小頁面當 smoke test，同時驗證 CSS variables、Sonner Toaster、tRPC server call、Geist 字型套用。三層 CLAUDE.md（root / `src/components/` / `src/components/ui/`）建立可被 LLM 與人類同時辨識的信號。

**Tech Stack:** Next.js 16 (Turbopack), React 19, TypeScript strict（`verbatimModuleSyntax: true`）, Tailwind v4, shadcn/ui (CLI), pnpm 10, lucide-react, sonner.

**Spec:** `docs/superpowers/specs/2026-05-02_shadcn-integration-design.md`

---

## File Structure

**New files:**

| Path | Responsibility |
|------|----------------|
| `components.json` | shadcn CLI 設定（base=zinc、style=new-york、icon=lucide） |
| `CLAUDE.md` | repo root — 對 Claude Code 與人類宣告 shadcn ready |
| `src/lib/utils.ts` | `cn()` helper（`clsx` + `tailwind-merge`） |
| `src/components/CLAUDE.md` | components 邊界宣告（ui = shadcn primitive、其他 = 應用層） |
| `src/components/ui/CLAUDE.md` | 21 個元件清單、加裝指令、E2E 注意事項 |
| `src/components/ui/*.tsx` | 21 個 shadcn 元件（CLI 自動產生） |
| `src/app/_components/toast-trigger.tsx` | client component，按鈕觸發 sonner toast（smoke test） |

**Modified files:**

| Path | 修改內容 |
|------|----------|
| `src/styles/globals.css` | CLI 加入 `@import "tw-animate-css";` + `@theme inline` + `:root`/`.dark` Zinc tokens；保留既有 `@theme { --font-sans }` |
| `src/app/layout.tsx` | 掛 `<Toaster />`、body 加 `bg-background text-foreground font-sans antialiased`、html 加 `suppressHydrationWarning` |
| `src/app/page.tsx` | 重做為 Card + 兩個 Button + tRPC greeting |
| `package.json` / `pnpm-lock.yaml` | 由 CLI 自動更新（新增 ~19 個 runtime deps） |

---

## Task 0: 準備 feature branch

**Files:** 無檔案變更，純 git 操作。

**Context:** 目前 main 分支本地有一個 spec docs commit（`458fad3`）尚未 push。先把 docs commit push 到 origin/main（單檔 docs，符合 user 規約「簡單改動直接 main」），再從乾淨 main 切 feature branch 做實作 PR。

- [ ] **Step 1: 確認當前 git 狀態乾淨**

```bash
git status
git log --oneline origin/main..HEAD
```

Expected：working tree clean；本地比 origin/main 多 1 個 commit（spec）。

- [ ] **Step 2: Push spec commit 到 origin/main**

```bash
git push origin main
```

Expected：fast-forward push 成功，1 commit pushed。

- [ ] **Step 3: 建立 feature branch**

```bash
git checkout -b feat/shadcn-integration
```

Expected：切到新 branch `feat/shadcn-integration`。

---

## Task 1: shadcn init

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Modify: `src/styles/globals.css`（CLI 自動）
- Modify: `package.json`、`pnpm-lock.yaml`（CLI 自動）

- [ ] **Step 1: 執行 shadcn init（互動模式，但用 flag 跳過提問）**

```bash
pnpm dlx shadcn@latest init --base-color zinc --yes
```

Expected：
- 偵測到 Next.js + Tailwind v4
- 建立 `components.json`
- 建立 `src/lib/utils.ts`
- 修改 `src/styles/globals.css`（加入 `@import "tw-animate-css";`、`@theme inline`、`:root` 與 `.dark` 區塊）
- 安裝相依：`class-variance-authority`、`clsx`、`tailwind-merge`、`tw-animate-css`、`lucide-react`

> 若 CLI 進入互動模式詢問 style / icons 等，選 `new-york` style、`lucide` icons；遇到「使用 src 目錄？」回 yes。

> **Implementation note (2026-05-02 verified):** shadcn CLI 4.6.0 的 `init` 改成 preset 系統，已**不再支援** `--base-color zinc` + `style: "new-york"` 旗標組合，會生成 `style: "base-nova"` / `baseColor: "neutral"`。`shadcn@2` 也因 registry validation 在新版 globals.css schema 上失敗。實作上的 workaround：手動建 `components.json`（依下面 Step 2 的範本）+ 手動 `pnpm add` 5 個 base deps + 手動寫 `src/lib/utils.ts` 與 `src/styles/globals.css`（用 shadcn 官方 Zinc oklch tokens）。**`add` 路徑仍可用 `shadcn@latest`**（init 與 add 路徑分裂，add 向後相容）。

- [ ] **Step 2: 驗證 components.json 內容**

```bash
cat components.json
```

Expected 包含：
```json
{
  "style": "new-york",
  "tailwind": { "css": "src/styles/globals.css", "baseColor": "zinc" },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

- [ ] **Step 3: 驗證 src/lib/utils.ts**

```bash
cat src/lib/utils.ts
```

Expected：

```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: 驗證 globals.css 既有 `@theme` 與 CLI 加入內容共存**

```bash
cat src/styles/globals.css
```

Expected：
- `@import "tailwindcss";` 在頂端
- 新增 `@import "tw-animate-css";`
- 既有 `@theme { --font-sans: ... }` 仍保留
- 新增 `@theme inline { --color-background: var(--background); ... }` 區塊
- 新增 `:root { --background: oklch(1 0 0); ... }` 與 `.dark { --background: oklch(0.141 ... ); ... }` 區塊

> 如果既有 `@theme { --font-sans }` 被併進新區塊或被刪掉，手動還原。兩塊 `@theme` 與 `@theme inline` 是不同語意，不能合併。

- [ ] **Step 5: typecheck**

```bash
pnpm typecheck
```

Expected：PASS。

- [ ] **Step 6: Commit**

```bash
git add components.json src/lib/utils.ts src/styles/globals.css package.json pnpm-lock.yaml
git commit -m "feat(ui): init shadcn/ui with Zinc base"
```

---

## Task 2: 一次加入 21 個元件

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/form.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/alert-dialog.tsx`
- Create: `src/components/ui/sonner.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/dropdown-menu.tsx`
- Create: `src/components/ui/select.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/tooltip.tsx`
- Create: `src/components/ui/sheet.tsx`
- Create: `src/components/ui/avatar.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/skeleton.tsx`
- Create: `src/components/ui/separator.tsx`
- Create: `src/components/ui/popover.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/switch.tsx`

- [ ] **Step 1: 一次 add 全部 21 個元件**

```bash
pnpm dlx shadcn@latest add button input label form dialog alert-dialog sonner card dropdown-menu select table tabs tooltip sheet avatar badge skeleton separator popover checkbox switch --yes
```

Expected：
- 21 個 `.tsx` 檔案出現在 `src/components/ui/`
- 單一 `radix-ui` umbrella package + `react-hook-form` + `@hookform/resolvers` + `sonner` + 可能 `cmdk` 被裝入 `package.json`（modern shadcn 不再裝散裝 `@radix-ui/react-*`）
- 沒有錯誤訊息

- [ ] **Step 2: 確認 21 個檔案都生出來**

```bash
ls src/components/ui/ | sort
```

Expected：21 個 `.tsx` 檔（alert-dialog、avatar、badge、button、card、checkbox、dialog、dropdown-menu、form、input、label、popover、select、separator、sheet、skeleton、sonner、switch、table、tabs、tooltip）。

- [ ] **Step 3: 確認 dependencies 已更新**

```bash
grep -E "radix-ui|react-hook-form|sonner|cmdk" package.json
```

Expected：列出新增的 Radix / form / toast 相依。

- [ ] **Step 4: typecheck（注意：build 還沒跑，type-only import 問題還抓不到）**

```bash
pnpm typecheck
```

Expected：PASS。

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ package.json pnpm-lock.yaml
git commit -m "feat(ui): add 21 shadcn/ui components"
```

---

## Task 3: Build 驗證 + 修 type-only import

**Files:**
- Modify (僅當有錯時): `src/components/ui/*.tsx` 中含 `import { type X }` 的檔案

**Why this task exists:** Memory `feedback_turbopack_type_imports.md` 記載 Next 16 Turbopack production build 對 `import { type X }` 與 `import type { X }` 處理不同；shadcn CLI 偶會生出前者寫法。`pnpm typecheck`（tsc）不會抓到，**只有 `pnpm build` 才會**。

- [ ] **Step 1: 跑 production build**

```bash
pnpm build
```

Expected（最佳情況）：build PASS，沒有 type import 相關錯誤。

若失敗，錯誤訊息會類似：
```
Type error: 'X' cannot be used as a value because it was imported using 'import type'.
```
或（反向）：
```
'X' is a type and must be imported using a type-only import when 'verbatimModuleSyntax' is enabled.
```

- [ ] **Step 2: 若 build 失敗，找出所有問題檔**

```bash
grep -rn "import { type " src/components/ui/
```

Expected：列出所有 `import { type X }` 的位置。

- [ ] **Step 3: 修正寫法**

對每個出問題的檔案，把：

```tsx
import { type ComponentProps, forwardRef } from "react"
```

改成：

```tsx
import type { ComponentProps } from "react"
import { forwardRef } from "react"
```

或使用 inline type-only：

```tsx
import { forwardRef, type ComponentProps } from "react"
```

> 兩種寫法在 `verbatimModuleSyntax: true` 下都合法，但根據 memory 記載，**Turbopack production 對 inline 寫法可能有問題**。優先用獨立 `import type` 行。

- [ ] **Step 4: 重跑 build 直到 PASS**

```bash
pnpm build
```

Expected：PASS。

- [ ] **Step 5: 還原可能被 build 改寫的 next-env.d.ts**

```bash
git status
git checkout -- next-env.d.ts 2>/dev/null || true
git checkout -- tsconfig.json 2>/dev/null || true
```

> 參考 user CLAUDE.md pitfall #5（next-env.d.ts）+ memory `project_next16_tsconfig_mutation.md`（tsconfig）。這兩個檔案會被 dev/build 自動改寫，不該進 commit。

- [ ] **Step 6: Commit（僅當有實際修正）**

如果 Step 3 有改檔：

```bash
git add src/components/ui/
git commit -m "fix(ui): use type-only imports for Turbopack compat"
```

如果 Step 1 一次就過、沒改任何檔，跳過 commit。

---

## Task 4: 修改 layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`（整檔重寫，~30 行）

- [ ] **Step 1: 重寫 layout.tsx**

新內容：

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

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
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

四處差異 vs 原檔：
1. `import { type Metadata }` → `import type { Metadata }`（Turbopack 安全）
2. 加 `import { Toaster } from "@/components/ui/sonner";`
3. `<html>` 加 `suppressHydrationWarning`、刪掉 backtick 字串
4. `<body>` 加 className、結尾加 `<Toaster />`

- [ ] **Step 2: typecheck**

```bash
pnpm typecheck
```

Expected：PASS。

- [ ] **Step 3: build**

```bash
pnpm build
```

Expected：PASS。

- [ ] **Step 4: 還原 next-env.d.ts / tsconfig.json noise**

```bash
git checkout -- next-env.d.ts 2>/dev/null || true
git checkout -- tsconfig.json 2>/dev/null || true
```

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(ui): mount Toaster and apply theme classes in root layout"
```

---

## Task 5: 建立 toast-trigger 並重寫 page.tsx

**Files:**
- Create: `src/app/_components/toast-trigger.tsx`
- Modify: `src/app/page.tsx`（整檔重寫）

- [ ] **Step 1: 建立 src/app/_components/toast-trigger.tsx**

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ToastTrigger() {
  return (
    <Button onClick={() => toast.success("shadcn 工作正常")}>
      測試 toast
    </Button>
  );
}
```

- [ ] **Step 2: 重寫 src/app/page.tsx**

```tsx
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, HydrateClient } from "@/trpc/server";

import { ToastTrigger } from "./_components/toast-trigger";

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
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noreferrer"
              >
                shadcn docs
              </a>
            </Button>
          </CardContent>
        </Card>
      </main>
    </HydrateClient>
  );
}
```

- [ ] **Step 3: typecheck**

```bash
pnpm typecheck
```

Expected：PASS。

- [ ] **Step 4: build**

```bash
pnpm build
```

Expected：PASS。

- [ ] **Step 5: 還原 next-env.d.ts / tsconfig.json noise**

```bash
git checkout -- next-env.d.ts 2>/dev/null || true
git checkout -- tsconfig.json 2>/dev/null || true
```

- [ ] **Step 6: Commit**

```bash
git add src/app/page.tsx src/app/_components/toast-trigger.tsx
git commit -m "feat(ui): rewrite home page as shadcn smoke test"
```

---

## Task 6: 瀏覽器手動 smoke test

**Files:** 無檔案變更，純驗證。

**Why this task exists:** typecheck + build 只能驗證編譯，無法驗證 hydration、CSS variables 載入、Radix portal、Sonner Toaster 實際彈出 toast。Spec 成功標準明列「按按鈕出現 toast」是必要驗證。

- [ ] **Step 1: 啟動 dev server（背景執行）**

執行者注意：用 Bash tool 的 `run_in_background: true` 啟動，否則會卡住。記下 bash_id 供 Step 5 結束用。

```bash
pnpm dev
```

Expected：Next.js dev server 在 `http://localhost:3000` 啟動，無編譯錯誤。等待 dev server log 出現 `Ready in` 字樣再進 Step 2。

- [ ] **Step 2: 用 Playwright MCP（或瀏覽器）打開首頁，截圖**

使用 `mcp__plugin_playwright_playwright__browser_navigate` 打開 `http://localhost:3000`，再用 `browser_snapshot` 確認：

- 顯示 Card 容器（有圓角、邊框、淺灰背景）
- Card 標題「T3 Stack + shadcn/ui」
- Card 描述顯示 tRPC greeting（"Hello from tRPC"）
- 兩個 Button：「測試 toast」(default variant) 與「shadcn docs」(outline variant)

- [ ] **Step 3: 點「測試 toast」按鈕，驗證 toast 出現**

使用 `browser_click` 點擊「測試 toast」按鈕，再 `browser_snapshot` 確認 sonner toast 出現在右下（或 sonner 預設位置），內容「shadcn 工作正常」。

- [ ] **Step 4: 檢查瀏覽器 console 無錯誤**

使用 `browser_console_messages` 確認：
- 無 hydration mismatch warning
- 無 React error
- 無 missing CSS / 404 資源

- [ ] **Step 5: 停 dev server，還原 dev-mutated 檔案**

執行者：使用 KillShell 工具關掉 Step 1 的背景 bash，或在背景 process 上送 SIGTERM。

```bash
git checkout -- next-env.d.ts 2>/dev/null || true
git checkout -- tsconfig.json 2>/dev/null || true
git status
```

Expected：working tree clean。

> 此 task **無 commit**，純瀏覽器驗證。

---

## Task 7: 三層 CLAUDE.md

**Files:**
- Create: `CLAUDE.md`（repo root）
- Create: `src/components/CLAUDE.md`
- Create: `src/components/ui/CLAUDE.md`

- [ ] **Step 1: 建立 root CLAUDE.md**

寫入 `/Users/chunn/projects/t3-template/CLAUDE.md`：

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

- `pnpm dev` — 啟動 dev server
- `pnpm build` — production build
- `pnpm typecheck` — TypeScript 檢查
- `pnpm lint` — ESLint
```

- [ ] **Step 2: 建立 src/components/CLAUDE.md**

寫入 `/Users/chunn/projects/t3-template/src/components/CLAUDE.md`：

```markdown
# components/

- `ui/` — shadcn/ui primitives（不要手改、不要新增非 shadcn 內容）
- `<feature>/` — 應用層複合元件，可自由組合 ui/ primitives
```

- [ ] **Step 3: 建立 src/components/ui/CLAUDE.md**

寫入 `/Users/chunn/projects/t3-template/src/components/ui/CLAUDE.md`：

```markdown
# components/ui — shadcn/ui

Base: zinc · Style: new-york · Icons: lucide-react

## Pre-installed (21)

Button · Input · Label · Form · Dialog · AlertDialog · Sonner (toast) ·
Card · DropdownMenu · Select · Table · Tabs · Tooltip · Sheet · Avatar ·
Badge · Skeleton · Separator · Popover · Checkbox · Switch

## Add more

```bash
pnpm dlx shadcn@latest add <name>
```

## Notes

- AlertDialog 確認 dialog 的 E2E：第二次 click 必須 scope 到 `getByRole("alertdialog")`，不可用 `.last()` / `.nth(1)`
- Toast：`import { toast } from "sonner"`，Toaster 已掛在 root layout
- Form：搭 `react-hook-form` + `zod` + `@hookform/resolvers` 三件套（皆已隨 Form 元件預裝）
- 不要用原生 `<button>` / `alert()` / `confirm()` — 一律用 shadcn primitive
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md src/components/CLAUDE.md src/components/ui/CLAUDE.md
git commit -m "docs: add three-layer CLAUDE.md for shadcn discoverability"
```

---

## Task 8: 最終驗證

**Files:** 無檔案變更，純驗證 + 還原 noise。

- [ ] **Step 1: 全套驗證指令**

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected：全部 PASS。

- [ ] **Step 2: 還原 next-env.d.ts / tsconfig.json**

```bash
git checkout -- next-env.d.ts 2>/dev/null || true
git checkout -- tsconfig.json 2>/dev/null || true
```

- [ ] **Step 3: 確認 working tree clean**

```bash
git status
```

Expected：`nothing to commit, working tree clean`。

> 若 status 仍有 diff（除了 next-env.d.ts / tsconfig.json），檢查是否為實際遺漏的修改。

- [ ] **Step 4: 確認分支 commit history 乾淨**

```bash
git log --oneline main..HEAD
```

Expected commits（順序由舊到新）：

1. `feat(ui): init shadcn/ui with Zinc base`
2. `feat(ui): add 21 shadcn/ui components`
3. `fix(ui): use type-only imports for Turbopack compat`（可能略過，視 Task 3 結果）
4. `feat(ui): mount Toaster and apply theme classes in root layout`
5. `feat(ui): rewrite home page as shadcn smoke test`
6. `docs: add three-layer CLAUDE.md for shadcn discoverability`

---

## Task 9: 開 PR

**Files:** 無檔案變更，純 git/gh 操作。

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/shadcn-integration
```

Expected：branch pushed，回傳 PR URL hint。

- [ ] **Step 2: 開 PR**

```bash
gh pr create --title "feat(ui): integrate shadcn/ui into t3-template" --body "$(cat <<'EOF'
## Summary

- 整合 shadcn/ui 進 template，預裝 21 個高頻元件（Button、Input、Form、Dialog、AlertDialog、Sonner、Card、DropdownMenu、Select、Table、Tabs、Tooltip、Sheet、Avatar、Badge、Skeleton、Separator、Popover、Checkbox、Switch）
- Base color = zinc、Style = new-york、Icons = lucide-react
- 重做 `src/app/page.tsx` 為 Card-based smoke test，驗證 CSS variables、Sonner Toaster、Geist 字型、tRPC server call
- 新增三層 CLAUDE.md（root / `src/components/` / `src/components/ui/`），讓 Claude Code 在 clone 後能直接辨識 shadcn 已 ready

## Spec
`docs/superpowers/specs/2026-05-02_shadcn-integration-design.md`

## Test plan

- [x] `pnpm typecheck` PASS
- [x] `pnpm lint` PASS
- [x] `pnpm build` PASS（Next 16 + Turbopack production）
- [x] `pnpm dev` 手動驗證：Card 渲染、按鈕觸發 sonner toast、無 console 錯誤
- [x] `git status` 無 next-env.d.ts / tsconfig.json noise

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected：PR 建立、回傳 PR URL。

- [ ] **Step 3: 回報 PR URL 給使用者**

把 PR URL 貼給使用者，讓他決定是否合併（依 user 慣例「自動 merge」可考慮 `gh pr merge --auto --squash`，但**不在此 plan 自動執行**，留給 review 後手動）。
