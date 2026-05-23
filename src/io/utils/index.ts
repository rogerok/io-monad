import { exhaustive } from "../../shared/exhaustive.ts";
import { fail, pure } from "../constructors/index.ts";
import { IO } from "../core/types.ts";
import { ParseError } from "./errors.ts";

export { exhaustive };
export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const parseJson = <A>(body: string): IO<A, ParseError> => {
  try {
    return pure(JSON.parse(body));
  } catch (e) {
    return fail(new ParseError(e instanceof Error ? String(e.cause) : "Cannot parse json", body));
  }
};
