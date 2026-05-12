import { readLine, writeLine } from "./ constructors.ts";
import { bind } from "./index.ts";
import { IO } from "./type.ts";

export const myProgram: IO<void> = bind(writeLine("What is your name?"), () =>
  bind(readLine, (name) =>
    bind(writeLine("Hello, " + name + "! How old are you?"), () =>
      bind(readLine, (age) => writeLine("Wow, " + name + ", " + age + " is a great age!")),
    ),
  ),
);
