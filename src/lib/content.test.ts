// Content validation is dependency-free and runs through scripts/validate-content.ts.
// Keeping validation outside the browser bundle allows `npm test` to run even in
// restricted environments where package downloads are unavailable.
export {}
