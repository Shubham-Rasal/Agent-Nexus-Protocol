import { z } from "zod";
import type { Entity, Relation } from "./graph.js";

/**
 * Zod schema for validating Entity objects
 */
export const EntitySchema = z.object({
  name: z.string().min(1, "Entity name cannot be empty"),
  entityType: z.string().min(1, "Entity type cannot be empty"),
  observations: z.array(z.string()).default([]),
});

/**
 * Zod schema for validating Relation objects
 */
export const RelationSchema = z.object({
  from: z.string().min(1, "Source entity ID cannot be empty"),
  to: z.string().min(1, "Target entity ID cannot be empty"),
  relationType: z.string().min(1, "Relation type cannot be empty"),
});

/**
 * Type-safe validation function for Entity objects
 */
export function validateEntity(
  data: unknown,
): { success: true; data: Entity } | { success: false; error: z.ZodError } {
  const result = EntitySchema.safeParse(data);
  return result;
}

/**
 * Type-safe validation function for Relation objects
 */
export function validateRelation(
  data: unknown,
): { success: true; data: Relation } | { success: false; error: z.ZodError } {
  const result = RelationSchema.safeParse(data);
  return result;
}
