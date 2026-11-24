import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextDecoder, TextEncoder });

// React only logs "Maximum update depth exceeded" for a render loop started
// in an effect and keeps looping: the test never ends and its worker keeps
// growing. Throwing on that warning fails the test right away. Tests that
// silence console.error bypass this; the heap cap of `npm test` covers them.
const consoleError = console.error;
console.error = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("Maximum update depth exceeded")) {
    throw new Error(`Render loop: ${args[0].split("\n")[0]}`);
  }
  consoleError(...args);
};
