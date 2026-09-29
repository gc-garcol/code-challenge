function assertInteger(n: number): void {
  if (!Number.isInteger(n)) {
    throw new TypeError(`n must be an integer, received ${n}`);
  }
}

/**
 * Công thức cấp số cộng
 * S = count * (first + last) / 2
 *
 * Time complexity:  O(1)
 * Space complexity: O(1)
 */
export function sum_to_n_a(n: number): number {
  assertInteger(n);
  if (n <= 0) return 0;
  const first = 1;
  const last = n;
  const count = n;
  return (count * (first + last)) / 2;
}

/**
 * Loop
 * 
 * Time complexity:  O(n)
 * Space complexity: O(1)
 */
export function sum_to_n_b(n: number): number {
  assertInteger(n);
  let sum = 0;
  for (let i = 1; i <= n; i++) {
    sum += i;
  }
  return sum;
}

/**
 * Recursive - chia để trị
 *
 * Time complexity:  O(n)
 * Space complexity: O(log n)
 */
export function sum_to_n_c(n: number): number {
  assertInteger(n);
  if (n <= 0) return 0;
  return sumRange(1, n);
}

function sumRange(lo: number, hi: number): number {
  if (lo === hi) return lo;
  const mid = Math.floor((lo + hi) / 2);
  return sumRange(lo, mid) + sumRange(mid + 1, hi);
}
