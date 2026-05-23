import { createInterface } from "node:readline";

import { FetchError, HttpError } from "../utils/errors.ts";
import { sleep } from "../utils/index.ts";

type Fetches = {
  url: string;
};

export interface World {
  fetch: (url: string, options?: RequestInit) => Promise<string>;
  readLine: () => Promise<string>;
  sleep: (ms: number) => Promise<void>;
  writeLine: (s: string) => Promise<void>;
}

export type TestWorld = {
  fetches: Fetches[];
  output: string[];
} & World;

type TypedFetchMock =
  | {
      body?: string;
      networkError?: string;
      status?: number;
    }
  | string;

export type TypedTestWorld = {
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
    //  eslint-disable-next-line @typescript-eslint/require-await
    fetch: async (url: string) => {
      const mockUrl = fetchMocks[url];

      if (mockUrl === undefined) {
        throw new Error(`fetch to ${url} not mocked`);
      }
      fetches.push({ url });

      return mockUrl;
    },
    fetches,
    output,
    //  eslint-disable-next-line @typescript-eslint/require-await
    readLine: async () => {
      if (cursor >= inputs.length) {
        throw new Error("readLine called more times than inputs provided");
      }

      const value = inputs[cursor];

      if (value === undefined) {
        throw new Error("Can't read line");
      }

      cursor += 1;
      return value;
    },
    sleep,
    //  eslint-disable-next-line @typescript-eslint/require-await
    writeLine: async (s: string) => {
      output.push(s);
    },
  };
};

export const typedTestWorld = (args?: {
  fetchMocks?: Record<string, TypedFetchMock>;
  inputs?: string[];
}): TypedTestWorld => {
  let cursor = 0;
  const inputs = args?.inputs ?? [];
  const output: string[] = [];
  const fetchMocks: Record<string, TypedFetchMock> = args?.fetchMocks ?? {};
  const fetches: Fetches[] = [];

  return {
    fetch: async (url: string) => {
      const mock = fetchMocks[url];

      if (mock === undefined) {
        throw new FetchError(url, `fetch to ${url} not mocked`);
      }

      fetches.push({ url });

      if (typeof mock === "string") {
        return mock;
      }

      if (mock.networkError !== undefined) {
        throw new Error(mock.networkError);
      }

      const status = mock.status ?? 200;
      if (status < 200 || status >= 300) {
        throw new HttpError(status, url);
      }

      return mock.body ?? "";
    },
    fetches,
    output,
    readLine: async () => {
      if (cursor >= inputs.length) {
        throw new Error("readLine called more times than inputs provided");
      }

      const value = inputs[cursor];

      if (value === undefined) {
        throw new Error("Can't read line");
      }

      cursor += 1;
      return value;
    },
    sleep,
    writeLine: async (s: string) => {
      output.push(s);
    },
  };
};

export const productionBrowserWorld: World = {
  fetch: async (url: string) => {
    const resp = await fetch(url);
    return await resp.text();
  },
  //  eslint-disable-next-line @typescript-eslint/require-await
  readLine: async () => prompt() ?? "",
  sleep: (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  //  eslint-disable-next-line @typescript-eslint/require-await
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
    fetch: async (url: string, options?: RequestInit) => {
      const resp = await fetch(url, options);
      return await resp.text();
    },
    readLine: async () => {
      return new Promise<string>((res) => {
        rl.question("", (s) => {
          res(s);
        });
      });
    },
    sleep,
    //  eslint-disable-next-line @typescript-eslint/require-await
    writeLine: async (s: string) => {
      console.log(s);
    },
  };
};

type LoggingWorldConfig = {
  log: (line: string) => void;
};

export const loggingWorld = (inner: World, logConfig: LoggingWorldConfig): World => ({
  fetch: async (url: string, options?: RequestInit) => {
    logConfig.log("fetch " + url);
    return await inner.fetch(url, options);
  },
  readLine: async () => {
    const result = await inner.readLine();
    logConfig.log("readLine " + result);
    return result;
  },
  sleep: async (ms: number) => {
    logConfig.log("sleep " + ms.toString());
    await inner.sleep(ms);
  },
  writeLine: async (s: string) => {
    logConfig.log("writeLine " + s);
    await inner.writeLine(s);
  },
});
