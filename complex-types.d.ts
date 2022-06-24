// Need a random export to turn this into a module?
import type {Keyword, Keyphrase} from './index.js'

declare module 'vfile' {
  interface DataMap {
    /**
     * List of keywords.
     *
     * Populated by `retext-keywords` from the document.
     */
    keywords?: Keyword[]

    /**
     * List of keyphrases.
     *
     * Populated by `retext-keywords` from the document.
     */
    keyphrases?: Keyphrase[]
  }
}
