import { ApiException, Division, NovaPostApiFactory } from "../dist/index.js";

const apiKey = process.env.API_KEY ?? "";
const useSandbox = process.env.USE_SANDBOX === "true";

try {
  const novaPostApi = new NovaPostApiFactory().invoke(apiKey, undefined, useSandbox);
  const searchParams = {
    textSearch: "berlin",
    divisionCategories: [Division.DIVISION_CATEGORY_POSTOMAT],
  };

  const divisions = await novaPostApi.divisions().get(searchParams);
  const count = Array.isArray(divisions) ? divisions.length : "unknown";
  console.log(`Success: Retrieved ${String(count)} divisions`);
} catch (error) {
  if (error instanceof ApiException) {
    console.error(`API Error: ${error.message} (status: ${String(error.statusCode)})`);
  } else {
    console.error(error);
  }
}
