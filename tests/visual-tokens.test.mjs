import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

test("responsive rules do not redefine global brand colors", () => {
  const rootDefinitions = styles.match(/:root\s*\{/g) || [];
  assert.equal(rootDefinitions.length, 1);

  const responsiveStyles = styles.slice(styles.indexOf("@media"));
  for (const token of ["--paper:", "--paper-deep:", "--ink:", "--line:", "--accent:"]) {
    assert.equal(
      responsiveStyles.includes(token),
      false,
      `${token} must not be redefined inside responsive breakpoints`,
    );
  }
});
