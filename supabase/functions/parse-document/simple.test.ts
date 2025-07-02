import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("Simple test", () => {
  assertEquals(1 + 1, 2);
});

Deno.test("Mock test", async () => {
  // Test that our mocks work
  const { createMockFormData } = await import("./test-utils.ts");
  const formData = createMockFormData({
    file: { name: "test.txt", type: "text/plain", content: "Hello" },
    userId: "test-user"
  });
  
  const file = formData.get("file");
  assertEquals(file !== null, true);
});