import { render } from "./render.js";
import { unit1 } from "./content/unit1.js";

await render(unit1);
console.log(`Generated ${unit1.file}`);
