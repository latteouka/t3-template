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
- Tooltip：要用必須在 layout 包 `<TooltipProvider>`（目前 template 未加，第一次用 Tooltip 時加上）
- 不要用原生 `<button>` / `alert()` / `confirm()` — 一律用 shadcn primitive
