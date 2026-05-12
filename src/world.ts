import { createInterface } from "node:readline";

import { World } from "./type.ts";

type Fetches = {
  url: string;
};

export type TestWorld = {
  fetches: Fetches[];
  output: string[];
} & World;

export const testWorld = (args?: {
  fetchMocks?: Record<string, string>;
  inputs?: string[];
}): TestWorld => {
  let cursor = 0;
  const inputs = args?.inputs ?? [];
  const output: string[] = [];
  const fetchMocks: Record<string, string> = args?.fetchMocks ?? {};
  const fetches: Fetches[] = [];

  return {
    fetch: async (url) => {
      if (!(url in fetchMocks)) {
        throw new Error(`fetch to ${url} not mocked`);
      }
      fetches.push({ url });

      return fetchMocks[url];
    },
    fetches,
    output,
    readLine: async () => {
      if (cursor >= inputs.length) {
        throw new Error("readLine called more times than inputs provided");
      }

      const value = inputs[cursor];
      cursor += 1;
      return value;
    },
    writeLine: async (s: string) => {
      output.push(s);
    },
  };
};

export const productionBrowserWorld: World = {
  fetch: async (url) => {
    const resp = await fetch(url);
    return await resp.text();
  },
  readLine: async () => prompt() ?? "",
  writeLine: async (s: string) => {
    console.log(s);
  },
};

export const productionNodeWorld = (): World => {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return {
    fetch: async (url) => {
      const resp = await fetch(url);
      return await resp.text();
    },
    readLine: async () => {
      return new Promise<string>((res) => {
        rl.question("", (s) => {
          res(s);
        });
      });
    },
    writeLine: async (s: string) => {
      console.log(s);
    },
  };
};

type LogConfig = {
  log: (line: string) => void;
};

export const loggingWorld = (inner: World, logConfig: LogConfig): World => ({
  fetch: async (url) => {
    logConfig.log("fetch " + url);
    return await inner.fetch(url);
  },
  readLine: async () => {
    const result = await inner.readLine();
    logConfig.log("readLine " + result);
    return result;
  },
  writeLine: async (s: string) => {
    logConfig.log("writeLine " + s);
    await inner.writeLine(s);
  },
});
