export async function checkPending<T>(
  promise: Promise<T>
): Promise<{ resolved: false } | { resolved: true; value: T }> {
  const finish = Symbol();
  const value = await Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(finish);
      }, 0);
    }),
  ]);
  if (value === finish) {
    return { resolved: false };
  }
  return { resolved: true, value: value as T };
}
