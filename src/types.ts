import { YieldWrap } from "./gen.ts";

export type Pure<A> = {
  tag: "pure";
  value: A;
};

export type Readline<A, E> = {
  tag: "readLine";
  next: (a: string) => IO<A, E>;
};

export type WriteLine<A, E> = {
  next: IO<A, E>;
  tag: "writeLine";
  text: string;
};

export type Fetch<A, E> = {
  tag: "fetch";
  url: string;
  options?: RequestInit;
  next: (body: string) => IO<A, E>;
};

export type Sleep<A, E> = {
  ms: number;
  next: IO<A, E>;
  tag: "sleep";
};

export type Suspend<A, E> = {
  tag: "suspend";
  thunk: () => IO<A, E>;
};

export type IORef<A> = { current: A };

export type IONewRef<A, E> = {
  initial: unknown;
  tag: "newRef";
  next: (ref: IORef<unknown>) => IO<A, E>;
};

export type IOReadRef<A, E> = {
  ref: IORef<unknown>;
  tag: "readRef";
  next: (value: unknown) => IO<A, E>;
};

export type IOFail<E> = {
  error: E;
  tag: "fail";
};

export type IOWriteRef<A, E> = {
  next: IO<A, E>;
  ref: IORef<unknown>;
  tag: "writeRef";
  value: unknown;
};

export type RawIO<A, E = never> =
  | Fetch<A, E>
  | IOFail<E>
  | IONewRef<A, E>
  | IOReadRef<A, E>
  | IOWriteRef<A, E>
  | Pure<A>
  | Readline<A, E>
  | Sleep<A, E>
  | Suspend<A, E>
  | WriteLine<A, E>;

export type IOGen<A> = Generator<YieldWrap<IO<any>>, A>;

export type IO<A, E = never> = {
  [Symbol.iterator](): IOGen<A>;
} & RawIO<A, E>;

export type ResultOk<A> = { ok: true; value: A };
export type ResultError<E> = { error: E; ok: false; };

export type Result<A, E> = ResultError<E> | ResultOk<A>;
