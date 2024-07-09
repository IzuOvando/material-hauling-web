export function divideArray(array: any[], n: number): any[][] {
  const length = array.length;
  const k = Math.floor(length / n);
  const m = length % n;

  const result = new Array(n);
  let start = 0;

  for (let i = 0; i < n; i++) {
    const end = start + k + (i < m ? 1 : 0);
    result[i] = array.slice(start, end);
    start = end;
  }

  return result;
}
