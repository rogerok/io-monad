import { fail, pure } from "./ constructors.ts";
import { ParseError } from "./errors.ts";
import { IO } from "./types.ts";

export const exhaustive = (x: never): never => {
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  throw new Error(`Unexpected value: ${x}`);
};
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const parseJson = (body: string): IO<unknown, ParseError> => {
  try {
    return pure(JSON.parse(body));
  } catch (e) {
    return fail(new ParseError(e instanceof Error ? String(e.cause) : "Cannot parse json"));
  }
};
