import { createInterface } from "node:readline";
import { World } from "./type.ts";

export type TestWorld = World & {
  output: string[];
};

export const productionBrowserWorld: World = {
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
    readLine: async () => rl.question(""),
    writeLine: async (s: string) => {
      console.log(s);
    },
  };
};

export const testWorld = (inputs: string[]): TestWorld => {
  let cursor = 0;
  const output: string[] = [];

  return {
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

export const loggingWorld = (inner: World): World => ({
  readLine: async () => {
    const result = await inner.readLine();
    console.log("readline: ", result);
    return result;
  },
  writeLine: async (s: string) => {
    console.log("write line: ", s);
    await inner.writeLine(s);
  },
});
