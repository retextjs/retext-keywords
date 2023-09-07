import type {Keyphrase, Keyword} from './lib/index.js'

export type {
  Keyphrase,
  Keyword,
  KeywordMatch,
  Options,
  PhraseMatch,
  WordMatch
} from './lib/index.js'

export {default} from './lib/index.js'

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
