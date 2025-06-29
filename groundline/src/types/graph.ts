/**
 * Represents a node in the knowledge graph with its properties and observations
 */
export interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

/**
 * Represents a relationship between two entities in the knowledge graph
 */
export interface Relation {
  from: string;
  to: string;
  relationType: string;
}

/**
 * Type guard to check if an object is an Entity
 */
export function isEntity(obj: unknown): obj is Entity {
  if (!obj || typeof obj !== "object") return false;

  return (
    "name" in obj &&
    typeof (obj as Entity).name === "string" &&
    "entityType" in obj &&
    typeof (obj as Entity).entityType === "string" &&
    "observations" in obj &&
    Array.isArray((obj as Entity).observations) &&
    (obj as Entity).observations.every((obs) => typeof obs === "string")
  );
}

/**
 * Type guard to check if an object is a Relation
 */
export function isRelation(obj: unknown): obj is Relation {
  if (!obj || typeof obj !== "object") return false;

  return (
    "from" in obj &&
    typeof (obj as Relation).from === "string" &&
    "to" in obj &&
    typeof (obj as Relation).to === "string" &&
    "relationType" in obj &&
    typeof (obj as Relation).relationType === "string"
  );
}
