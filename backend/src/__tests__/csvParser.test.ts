import { parseCsvBuffer, chunkArray } from "../services/csvParser";

describe("parseCsvBuffer", () => {
  it("parses a simple CSV buffer correctly", () => {
    const csv = `name,email,phone
John Doe,john@example.com,9876543210
Jane Smith,jane@example.com,9876543211`;
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.total).toBe(2);
    expect(result.headers).toEqual(["name", "email", "phone"]);
    expect(result.rows[0]["name"]).toBe("John Doe");
    expect(result.rows[0]["email"]).toBe("john@example.com");
  });

  it("trims whitespace from keys and values", () => {
    const csv = `  name  ,  email  \n  John  ,  john@test.com  `;
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.rows[0]["name"]).toBe("John");
    expect(result.rows[0]["email"]).toBe("john@test.com");
  });

  it("returns empty result for empty CSV", () => {
    const result = parseCsvBuffer(Buffer.from(""));
    expect(result.total).toBe(0);
    expect(result.rows).toEqual([]);
    expect(result.headers).toEqual([]);
  });

  it("handles CSV with only headers and no data rows", () => {
    const csv = `name,email,phone`;
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.total).toBe(0);
  });

  it("strips BOM character from headers", () => {
    const csv = `\uFEFFname,email\nJohn,john@test.com`;
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.headers[0]).toBe("name");
    expect(result.rows[0]["name"]).toBe("John");
  });

  it("handles quoted fields with commas", () => {
    const csv = `name,address,email
"Doe, John","123 Main St, City",john@example.com`;
    const result = parseCsvBuffer(Buffer.from(csv));
    expect(result.rows[0]["name"]).toBe("Doe, John");
    expect(result.rows[0]["address"]).toBe("123 Main St, City");
  });
});

describe("chunkArray", () => {
  it("splits array into chunks of given size", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunkArray(arr, 3);
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it("returns single chunk when array is smaller than chunk size", () => {
    const arr = [1, 2];
    const chunks = chunkArray(arr, 10);
    expect(chunks).toEqual([[1, 2]]);
  });

  it("returns empty array for empty input", () => {
    expect(chunkArray([], 5)).toEqual([]);
  });

  it("handles chunk size of 1", () => {
    const arr = [1, 2, 3];
    const chunks = chunkArray(arr, 1);
    expect(chunks).toEqual([[1], [2], [3]]);
  });
});
