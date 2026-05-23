import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { modifyRef, orElse } from "../io/combinators/index.ts";
import { fetchUrl, newRef, pure, readLine, readRef, writeLine } from "../io/constructors/index.ts";
import { doIO } from "../io/do.ts";
import { FetchError, HttpError } from "../io/utils/errors.ts";
import { runIO } from "../io/runtime/run-io.ts";
import { sleep } from "../io/utils/index.ts";

export const myProgram = doIO(function* () {
  const stepCount = yield* newRef(0);

  yield* writeLine("What is your name?");
  yield* modifyRef(stepCount, (n) => n + 1);
  const name = yield* readLine;

  yield* writeLine(`Hello, ${name}! How old are you?`);
  yield* modifyRef(stepCount, (n) => n + 1);
  const age = yield* readLine;

  yield* writeLine("Loading greeting of the day...");
  yield* modifyRef(stepCount, (n) => n + 1);
  const body = yield* orElse(fetchUrl("https://httpbin.org/uuid"), () => pure("default-token"));

  const total = yield* readRef(stepCount);
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  yield* writeLine(`Wow, ${name}, ${age}! Token: ${body}. Steps: ${total}`);
});

void (async () => {
  const rl = readline.createInterface({ input, output });

  const productionNodeWorld = {
    fetch: async (url: string, options?: RequestInit) => {
      let resp: Response;

      try {
        resp = await fetch(url, options);
      } catch (e) {
        throw new FetchError(url, e);
      }

      if (resp.status > 299) {
        throw new HttpError(resp.status, url);
      } else {
        return await resp.text();
      }
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
