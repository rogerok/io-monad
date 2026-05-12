export type Pure1<A> = {
  tag: "pure";
  value: A;
};

export type Readline1<A> = {
  tag: "readLine";
  next: (a: string) => IO<A>;
};

export type WriteLine1<A> = {
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

export type IO<A> = Fetch<A> | Pure1<A> | Readline1<A> | WriteLine1<A>;

export interface World {
  fetch: (url: string, options?: RequestInit) => Promise<string>;
  readLine: () => Promise<string>;
  writeLine: (s: string) => Promise<void>;
}
