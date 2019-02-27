/**
 * TypeScript doesn’t have proper opaque types, so to simulate opaque types we
 * use a symbol only accessible in this module. No one outside of this module
 * can create an `ID` type.
 */
const idType = Symbol();

/**
 * An ID for the specified entity. IDs for two different entities can
 * not be mixed.
 *
 * Internally, the ID may be implemented however you’d like. The ID could be a
 * number, string, or even an object! It doesn’t matter as long as it has this
 * opaque interface.
 */
export type ID<Entity> = {[idType]: Entity};
