// Barrel re-export. The actual server actions live in ./actions/*.ts (each a
// "use server" module grouped by domain). This file keeps the historical import
// path `@/app/[locale]/actions` working so no consumer needs to change.
export * from "./actions/profile";
export * from "./actions/habits";
export * from "./actions/pet";
export * from "./actions/shop";
export * from "./actions/adventure";
export * from "./actions/mindfulness";
export * from "./actions/social";
export * from "./actions/memories";
export * from "./actions/tasks";
