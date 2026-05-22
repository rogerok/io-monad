import { YieldWrap } from "../gen.ts";

export type FreerFetch<R> = {
  _resp: R;
  tag: "fetch";
  url: string;
  options?: RequestInit;
};

export type FreerReadLine = { _resp: string; tag: "readLine" };
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type FreerWriteLine = { _resp: void; tag: "writeLine"; text: string };
export type FreerFail = { _resp: never; error: unknown; tag: "fail" };
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type FreerSleep = { _resp: void; ms: number; tag: "sleep" };
export type FreerPure<A> = { tag: "pure"; value: A };

export type FreerImpure<I extends Instr<any>, A> = {
  op: I;
  tag: "impure";
  cont: (resp: any) => Freer<I, A>;
};

export type FreerSuspend<I extends Instr<any>, A> = {
  tag: "suspend";
  thunk: () => Freer<I, A>;
};

export type Freer<I extends Instr<any>, A> = {
  [Symbol.iterator](): FreerGen<A>;
} & RawFreer<I, A>;

export type Instr<R = string> =
  | FreerFail
  | FreerFetch<R>
  | FreerReadLine
  | FreerSleep
  | FreerWriteLine;

export type RawFreer<I extends Instr<any>, A> =
  | FreerImpure<I, A>
  | FreerPure<A>
  | FreerSuspend<I, A>;

export type FreerIO<A, R = string> = Freer<Instr<R>, A>;

export type FreerGen<A> = Generator<YieldWrap<FreerIO<any>>, A>;
