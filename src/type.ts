export type Pure<A> = {
  tag: "pure";
  value: A;
};

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

export type IO<A> = Fetch<A> | Pure<A> | Readline<A> | Sleep<A> | WriteLine<A>;

export interface World {
  fetch: (url: string, options?: RequestInit) => Promise<string>;
  readLine: () => Promise<string>;
  sleep: (ms: number) => Promise<void>;
  writeLine: (s: string) => Promise<void>;
}
