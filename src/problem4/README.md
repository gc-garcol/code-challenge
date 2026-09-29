# Problem 4 — Three ways to sum to n

Three implementations of `sum_to_n(n)` (`1 + 2 + … + n`) in [`src/sum_to_n.ts`](./src/sum_to_n.ts). The task statement is in [`problem4.md`](./problem4.md).

| Function | Approach | Time | Space |
|----------|----------|------|-------|
| `sum_to_n_a` | Arithmetic series formula `n * (n + 1) / 2` | O(1) | O(1) |
| `sum_to_n_b` | Loop from 1 to n | O(n) | O(1) |
| `sum_to_n_c` | Recursive divide and conquer (split the range in half) | O(n) | O(log n) |

All three throw a `TypeError` if `n` is not an integer, and return `0` for `n ≤ 0`.

## Requirements

- Node.js 24+
- pnpm 12 (`corepack enable` picks up the version pinned in `package.json`)

## Run

```bash
pnpm install

pnpm start        # n = 5 (default)
pnpm start 100    # any integer n
pnpm start -3     # negative n → 0
```

Do not put `--` before the argument (`pnpm start -- 100`): pnpm passes the `--` through, and it is read as `NaN`.

Example output (each function's result and run time):

```
sum_to_n_a(100) = 5050  (0.022 ms)
sum_to_n_b(100) = 5050  (0.014 ms)
sum_to_n_c(100) = 5050  (0.037 ms)
```

## Typecheck and build

```bash
pnpm typecheck           # tsc --noEmit
pnpm build               # compiles to dist/
node dist/src/index.js 10
```

## Use in code

```ts
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./src/sum_to_n.ts";

sum_to_n_a(5); // 15
```
