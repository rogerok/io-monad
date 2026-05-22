import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { FetchError, HttpError } from "../errors.ts";
import { sleep } from "../utils.ts";
import { freerFetchUrl, freerRandom, freerReadLine, freerWriteLine } from "./constructors.ts";
import { freerDo } from "./freer-do.ts";
import { runWithLogging } from "./freer-run.ts";

const myProgram = freerDo(function* () {
  const greetings = ["Hello", "Hi", "Hey"];

  yield* freerWriteLine("What is your name?");
  const name = yield* freerReadLine;
  const greetingIndex = Math.floor((yield* freerRandom) * greetings.length);
  const greeting = greetings[greetingIndex] ?? greetings[0];
  yield* freerWriteLine(`${greeting}, ${name}! How old are you?`);
  const age = yield* freerReadLine;
  yield* freerWriteLine("Loading greeting of the day...");
  const body = yield* freerFetchUrl("https://httpbin.org/uuid");
  yield* freerWriteLine(`Wow, ${name}, ${age}! Token: ${body}`);
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
    random: Math.random,
    readLine: () => rl.question(""),
    sleep: sleep,
    //  eslint-disable-next-line @typescript-eslint/require-await
    writeLine: async (s: string) => {
      console.log(s);
    },
  };

  await runWithLogging(myProgram, productionNodeWorld, console.log);
  rl.close();
})();
