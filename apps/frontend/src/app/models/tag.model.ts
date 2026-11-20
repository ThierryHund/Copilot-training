/**
 * Tag statistics derived from photo collection.
 * 
 * Tags are not stored separately but derived by aggregating
 * all tags across photos.
 */
export interface TagStats {
  /** Tag name (lowercase, hyphen-separated) */
  name: string;
  
  /** Number of photos with this tag */
  count: number;
}
