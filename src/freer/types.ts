// export type FreeWriteLine<A> = { next: A; tag: "writeLine"; text: string };
// export type FreeFetch = { tag: "fetch"; url: string; next: (body: string) => A };
// export type FreerReadLine<A> = { tag: "readLine"; next: (s) => A };
// export type FreeFail = { error: unknown; tag: "fail" };
//
// export type InstrF<A> = FreeFail | FreeFetch | FreerReadLine<A> | FreeWriteLine<A>;
//
// export type FreePure<A> = { tag: "pure"; value: A };
// export type FreeImpure<F> = { instr: F; tag: "impure" };
//
// export type Free<F, A> = FreeImpure<F> | FreePure<A>;

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

export type FreerPure<A> = { tag: "pure"; value: A };

export type FreerImpure<I, A> = { op: I; tag: "impure"; cont: (resp: any) => Freer<I, A> };

export type Freer<I, A> = FreerImpure<I, A> | FreerPure<A>;

export type Instr<R> = FreerFail   | FreerFetch<R> | FreerReadLine;
