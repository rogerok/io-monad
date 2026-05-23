import { YieldWrap } from "../../shared/yield-wrap.ts";

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
  onError: (err: unknown) => IO<A, E>;
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

export type IODie = {
  defect: unknown;
  tag: "die";
};

export type Fail<E> = {
  _tag: "Fail";
  error: E;
};

export type Die = {
  _tag: "Die";
  defect: unknown;
};

export type Cause<E> = Die | Fail<E>;

export type Failure<E> = {
  _tag: "Failure";
  cause: Cause<E>;
};

export type Success<A> = {
  _tag: "Success";
  value: A;
};

export type Exit<E, A> = Failure<E> | Success<A>;

export type RawIO<A, E = never> =
  | Fetch<A, E>
  | IODie
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
export type ResultError<E> = { error: E; ok: false };

export type Result<E, A> = ResultError<E> | ResultOk<A>;
