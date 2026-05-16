import { pure } from "./ constructors.ts";
import { IO } from "./types.ts";

export const unit: IO<void> = pure(undefined) as IO<void>;
