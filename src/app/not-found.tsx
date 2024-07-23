// TODO: Improve NotFoundPage

import { FrenteReset } from "@/store";

export default function NotFound() {
  return (
    <section className="flex items-center justify-center mt-10">
      <div>
        <h2>Not Found</h2>
        <p>Could not find requested resource</p>
        <a href="/">Return Home</a>
      </div>
      <FrenteReset />
    </section>
  );
}
