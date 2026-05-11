import "./style.css";
import { setupCounter } from "./counter.ts";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root '#app' was not found.");
}

app.innerHTML = `
  <main>
    <h1>io-monad</h1>
    <p>Vite + TypeScript + Vitest</p>
    <button id="counter" type="button"></button>
  </main>
`;

const counterButton = document.querySelector<HTMLButtonElement>("#counter");

if (!counterButton) {
  throw new Error("Counter button '#counter' was not found.");
}

setupCounter(counterButton);
