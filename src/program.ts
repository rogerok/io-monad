import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

import { bind } from "./combinators.ts";
import { fetchUrl, readLine, writeLine } from "./ constructors.ts";
import { runIO } from "./run-io.ts";
import { IO } from "./types.ts";
import { sleep } from "./utils.ts";

const myProgram: IO<void> = bind(writeLine("What is your name?"), () =>
  bind(readLine, (name) =>
    bind(writeLine(`Hello, ${name}! How old are you?`), () =>
      bind(readLine, (age) =>
        bind(writeLine("Loading greeting of the day..."), () =>
          bind(fetchUrl("https://httpbin.org/uuid"), (body) =>
            writeLine(`Wow, ${name}, ${age}! Today's lucky token: ${body}`),
          ),
        ),
      ),
    ),
  ),
);

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
