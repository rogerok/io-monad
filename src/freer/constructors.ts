import { freerMk } from "./freer-mk.ts";
import {
  FreerFail,
  FreerFetch,
  FreerIO,
  FreerReadLine,
  FreerSleep,
  FreerWriteLine,
} from "./types.ts";

export const freerPure = <A>(value: A): FreerIO<A> =>
  freerMk({
    tag: "pure",
    value,
  });

export const freerReadLine: FreerIO<string> = freerMk({
  cont: freerPure,
  op: {
    tag: "readLine",
  } as FreerReadLine,
  tag: "impure",
});

export const freerWriteLine = (text: string): FreerIO<void> =>
  freerMk({
    cont: () => freerPure(undefined),
    op: {
      tag: "writeLine",
      text,
    } as FreerWriteLine,
    tag: "impure",
  });

export const freerFetchUrl = (url: string, options?: RequestInit): FreerIO<string> =>
  freerMk({
    cont: (body: string) => freerPure(body),
    op: {
      options,
      tag: "fetch",
      url,
    } as FreerFetch<string>,
    tag: "impure",
  });

export const freerFail = <E>(error: E): FreerIO<E> =>
  freerMk({
    // Maybe need to rewrite
    cont: (e) => {
      throw e;
    },
    op: {
      error,
      tag: "fail",
    } as FreerFail,
    tag: "impure",
  });

export const freerSleep = (ms: number): FreerIO<void> =>
  freerMk({
    cont: () => freerPure(undefined),
    op: {
      ms,
      tag: "sleep",
    } as FreerSleep,
    tag: "impure",
  });

export const freerSuspend = <A>(thunk: () => FreerIO<A>): FreerIO<A> =>
  freerMk({
    tag: "suspend",
    thunk,
  });
