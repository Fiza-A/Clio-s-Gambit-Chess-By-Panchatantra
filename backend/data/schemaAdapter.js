/** @deprecated Use dbSchema.js — kept for any stale imports. */
export { mapStudentStory as mapContentStoryRow } from './dbSchema.js';

export function buildSchemaInfo(tables) {
  const set = new Set(tables);
  return {
    tables: [...tables],
    hasModule: set.has('module'),
    hasChapter: set.has('chapter'),
    hasStories: set.has('stories'),
    hasPrinciples: set.has('principles'),
    hasStoryPrincipleMapping: set.has('storyprinciplemapping'),
    hasLogin: set.has('Login'),
    hasPrinciplePosition: set.has('principle_position'),
    hasChessPuzzle: set.has('chess_puzzle'),
    curriculumReady: set.has('module') && set.has('chapter') && set.has('stories') && set.has('storyprinciplemapping'),
  };
}
