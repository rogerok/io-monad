import { YieldWrap } from "./gen.ts";

export type Readline<A> = {
  tag: "readLine";
  next: (a: string) => IO<A>;
};

export type WriteLine<A> = {
  next: IO<A>;
  tag: "writeLine";
  text: string;
};

export type Fetch<A> = {
  tag: "fetch";
  url: string;
  options?: RequestInit;
  next: (body: string) => IO<A>;
};

export type Sleep<A> = {
  ms: number;
  next: IO<A>;
  tag: "sleep";
};

export type Suspend<A> = {
  tag: "suspend";
  thunk: () => IO<A>;
};

export type IORef<A> = { current: A };

export type IONewRef<A> = {
  initial: unknown;
  tag: "newRef";
  next: (ref: IORef<unknown>) => IO<A>;
};

export type IOReadRef<A> = {
  ref: IORef<unknown>;
  tag: "readRef";
  next: (value: unknown) => IO<A>;
};

export type IOWriteRef<A> = {
  next: IO<A>;
  ref: IORef<unknown>;
  tag: "writeRef";
  value: unknown;
};

export type RawIO<A> =
  | Fetch<A>
  | IONewRef<A>
  | IOReadRef<A>
  | IOWriteRef<A>
  | Pure<A>
  | Readline<A>
  | Sleep<A>
  | Suspend<A>
  | WriteLine<A>;

export type IOGen<A> = Generator<YieldWrap<IO<any>>, A>;

export type IO<A> = {
  [Symbol.iterator](): IOGen<A>;
} & RawIO<A>;

export type Pure<A> = {
  tag: "pure";
  value: A;
};

export interface World {
  fetch: (url: string, options?: RequestInit) => Promise<string>;
  readLine: () => Promise<string>;
  sleep: (ms: number) => Promise<void>;
  writeLine: (s: string) => Promise<void>;
}
