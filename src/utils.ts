export const exhaustive = (x: never): never => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unexpected value: ${x}`);
};
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
