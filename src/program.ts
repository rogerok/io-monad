import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { modifyRef } from "./combinators.ts";
import { fetchUrl, newRef, readLine, readRef, writeLine } from "./ constructors.ts";
import { doIO } from "./do-io.ts";
import { runIO } from "./run-io.ts";
import { sleep } from "./utils.ts";

const myProgram = doIO(function* () {
  const stepCount = yield* newRef(0);

  yield* writeLine("What is your name?");
  yield* modifyRef(stepCount, (n) => n + 1);
  const name = yield* readLine;

  yield* writeLine(`Hello, ${name}! How old are you?`);
  yield* modifyRef(stepCount, (n) => n + 1);
  const age = yield* readLine;

  yield* writeLine("Loading greeting of the day...");
  yield* modifyRef(stepCount, (n) => n + 1);
  const body = yield* fetchUrl("https://httpbin.org/uuid");

  const total = yield* readRef(stepCount);
  yield* writeLine(`Wow, ${name}, ${age}! Token: ${body}. Steps: ${total}`);
});

void (async () => {
  const rl = readline.createInterface({ input, output });

  const productionNodeWorld = {
    fetch: async (url: string, options?: RequestInit) => {
      // let resp: Response;

      const resp = await fetch(url, options);

      return await resp.text();
      // try {
      //   resp = await fetch(url, options);
      // } catch (e) {
      //   throw new FetchError(url, e);
      // }

      // if (resp.status > 299) {
      //   throw new HttpError(resp.status, url);
      // } else {
      //   return await resp.text();
      // }
    },
    readLine: () => rl.question(""),
    sleep: sleep,
    //  eslint-disable-next-line @typescript-eslint/require-await
    writeLine: async (s: string) => {
      console.log(s);
    },
  };

  await runIO(myProgram, productionNodeWorld);
  rl.close();
})();
