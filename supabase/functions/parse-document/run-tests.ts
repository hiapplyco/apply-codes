#!/usr/bin/env -S deno run --allow-env --allow-net

// Simple test runner for parse-document tests
console.log("Running parse-document tests...\n");

// Run tests with a timeout to prevent hanging
const command = new Deno.Command("deno", {
  args: [
    "test",
    "--allow-env",
    "--allow-net",
    "--no-check", // Skip type checking for faster runs
    "--parallel", // Run tests in parallel
    "index.test.ts"
  ],
  cwd: Deno.cwd(),
});

const child = command.spawn();

// Set a timeout
const timeout = setTimeout(() => {
  console.error("\nTests timed out after 30 seconds");
  child.kill();
  Deno.exit(1);
}, 30000);

const { code, stdout, stderr } = await child.output();

clearTimeout(timeout);

// Output results
const textDecoder = new TextDecoder();
if (stdout.length > 0) {
  console.log(textDecoder.decode(stdout));
}
if (stderr.length > 0) {
  console.error(textDecoder.decode(stderr));
}

console.log(`\nTest run completed with exit code: ${code}`);
Deno.exit(code);