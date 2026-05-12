import { IO } from "./type.ts";

export const pure = <A>(value: A): IO<A> => ({
  tag: "pure",
  value: value,
});

export const readLine: IO<string> = {
  next: pure,
  tag: "readLine",
};

export const writeLine = (text: string): IO<void> => ({
  next: pure(undefined),
  tag: "writeLine",
  text,
});

export const fetchUrl = (url: string, options?: RequestInit): IO<string> => ({
  next: pure,
  options,
  tag: "fetch",
  url,
});
