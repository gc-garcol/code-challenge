import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./sum_to_n.ts";

const n = Number(process.argv[2] ?? 5);

for (const fn of [sum_to_n_a, sum_to_n_b, sum_to_n_c]) {
  const start = performance.now();
  const result = fn(n);
  const ms = (performance.now() - start).toFixed(3);
  console.log(`${fn.name}(${n}) = ${result}  (${ms} ms)`);
}
