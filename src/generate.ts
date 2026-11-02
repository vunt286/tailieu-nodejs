import { render } from "./render.js";
import { unit1 } from "./content/unit1.js";
import { unit1Vi } from "./content/unit1.vi.js";

for (const doc of [unit1, unit1Vi]) {
  await render(doc);
  console.log(`Generated ${doc.file}`);
}
