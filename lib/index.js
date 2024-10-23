/**
 * @import {Root, SentenceContent, Sentence, Word} from 'nlcst'
 * @import {VFile} from 'vfile'
 */

/**
 * @typedef Keyphrase
 *   Info on a key phrase.
 * @property {Array<PhraseMatch>} matches
 *   All matches.
 * @property {number} score
 *   Score of phrase, for one match.
 * @property {Array<string>} stems
 *   Stems of phrase.
 * @property {number} weight
 *   Score of phrase, for all matches.
 *
 * @typedef Keyword
 *   Info on a keyword.
 * @property {Array<WordMatch>} matches
 *   All matches.
 * @property {number} score
 *   score of word, for all matches.
 * @property {string} stem
 *   Stem of word.
 *
 * @typedef Options
 *   Configuration.
 * @property {number | null | undefined} [maximum=5]
 *   Try to detect at most `maximum` words and phrases (default: `5`);
 *   actual counts may differ, for example, when two words have the same score,
 *   both will be returned; when too few words exist, less will be returned.
 *
 * @typedef PhraseMatch
 *   Match.
 * @property {Array<SentenceContent>} nodes
 *   Matched nodes.
 * @property {Sentence} parent
 *   Parent.
 *
 * @typedef WordMatch
 *   Match.
 * @property {Word} node
 *   Matched node.
 * @property {number} index
 *   Index of `node` in `parent`.
 * @property {Sentence} parent
 *   Parent.
 */

import {toString} from 'nlcst-to-string'
import {stemmer} from 'stemmer'
import {visit} from 'unist-util-visit'

/** @type {Readonly<Options>} */
const emptyOptions = {}

/**
 * Extract keywords and key phrases.
 *
 * The results are stored on `file.data.keyphrases` and  `file.data.keywords`.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns
 *   Transform.
 */
export default function retextKeywords(options) {
  const settings = options || emptyOptions
  const maximum = settings.maximum || 5

  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @param {VFile} file
   *   File.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree, file) {
    const important = getImportantWords(tree)
    file.data.keywords = filterResults(cloneKeywords(important), maximum)
    file.data.keyphrases = getKeyphrases(important, maximum)
  }
}

/**
 * Get the top results from an occurance map.
 *
 * @template {{score: number}} T
 *   Item kind.
 * @param {Readonly<Record<string, Readonly<T>>>} results
 *   Map.
 * @param {number} maximum
 *   Max.
 * @returns {Array<T>}
 *   Top results.
 */
function filterResults(results, maximum) {
  /** @type {Array<T>} */
  const filteredResults = []
  /** @type {Array<number>} */
  const indices = []
  /** @type {Record<number, Array<T>>} */
  const matrix = {}
  /** @type {string} */
  let key

  for (key in results) {
    if (Object.hasOwn(results, key)) {
      const score = results[key].score

      if (!Object.hasOwn(matrix, String(score))) {
        matrix[score] = []
        indices.push(score)
      }

      matrix[score].push(results[key])
    }
  }

  // Reverse sort: from 9 to 0.
  indices.sort(function (a, b) {
    return b - a
  })

  const maxScore = indices[0]

  let index = -1

  while (indices[++index]) {
    const column = matrix[indices[index]]
    const interpolated = indices[index] / maxScore
    let otherIndex = -1

    while (column[++otherIndex]) {
      column[otherIndex].score = interpolated
    }

    filteredResults.push(...column)

    if (filteredResults.length >= maximum) {
      break
    }
  }

  return filteredResults
}

/**
 * Find the phrase surrounding a node.
 *
 * @param {Readonly<WordMatch>} match
 *   Match.
 * @returns
 *   Result.
 */
function findPhrase(match) {
  const previous = findPhraseInDirection(match.parent, match.index, -1)
  const next = findPhraseInDirection(match.parent, match.index, 1)
  const stems = merge(previous.stems, stemNode(match.node), next.stems)

  return {
    nodes: merge(previous.nodes, match.node, next.nodes),
    stems,
    value: stems.join(' ')
  }
}

/**
 * Get following or preceding important words or white space.
 *
 * @param {Readonly<Sentence>} parent
 *   Parent.
 * @param {number} index
 *   Index.
 * @param {number} offset
 *   Direction.
 * @returns
 *   Result.
 */
function findPhraseInDirection(parent, index, offset) {
  /** @type {Array<SentenceContent>} */
  const nodes = []
  /** @type {Array<string>} */
  const stems = []
  /** @type {Array<SentenceContent>} */
  const queue = []

  while (parent.children[(index += offset)]) {
    const child = parent.children[index]

    if (child.type === 'WhiteSpaceNode') {
      queue.push(child)
    } else if (important(child)) {
      nodes.push(...queue, child)
      stems.push(stemNode(child))
      queue.length = 0
    } else {
      break
    }
  }

  return {stems, nodes}
}

/**
 * Get most important words in `node`.
 *
 * @param {Root} node
 *   Tree.
 * @returns {Record<string, Keyword>}
 *   Results.
 */
function getImportantWords(node) {
  /** @type {Record<string, Keyword>} */
  const words = {}

  visit(node, 'WordNode', function (word, index, parent) {
    if (
      parent &&
      // Should be a sentence, but theoretically could be directly in a root.
      parent.type === 'SentenceNode' &&
      index !== undefined &&
      important(word)
    ) {
      const stem = stemNode(word)
      const match = {index, node: word, parent}

      if (Object.hasOwn(words, stem)) {
        words[stem].matches.push(match)
        words[stem].score++
      } else {
        words[stem] = {matches: [match], score: 1, stem}
      }
    }
  })

  return words
}

/**
 * Get the top important phrases.
 *
 * @param {Readonly<Record<string, Readonly<Keyword>>>} results
 *   Results.
 * @param {number} maximum
 *   Max.
 * @returns
 *   Result.
 */
function getKeyphrases(results, maximum) {
  /** @type {Array<Word>} */
  const initialWords = []
  /** @type {Record<string, Keyphrase>} */
  const stemmedPhrases = {}
  /** @type {string} */
  let keyword

  // Iterate over all grouped important words…
  for (keyword in results) {
    if (Object.hasOwn(results, keyword)) {
      const matches = [...results[keyword].matches]
      let index = -1

      // Iterate over every occurence of a certain keyword…
      while (++index < matches.length) {
        const phrase = findPhrase(matches[index])
        const stemmedPhrase = stemmedPhrases[phrase.value]
        // Always a word as the head.
        const first = /** @type {Word} */ (phrase.nodes[0])
        const match = {nodes: phrase.nodes, parent: matches[index].parent}

        // If we've detected the same stemmed phrase somewhere.
        if (Object.hasOwn(stemmedPhrases, phrase.value)) {
          // Add weight per phrase to the score of the phrase.
          stemmedPhrase.score += stemmedPhrase.weight

          // If this is the first time we walk over the phrase (exact match but
          // containing another important word), add it to the list of matching
          // phrases.
          if (!initialWords.includes(first)) {
            initialWords.push(first)
            stemmedPhrase.matches.push(match)
          }
        } else {
          let otherIndex = -1
          let score = -1
          const stems = phrase.stems

          initialWords.push(first)

          // For every stem in phrase, add its score to score.
          while (stems[++otherIndex]) {
            score += results[stems[otherIndex]].score
          }

          stemmedPhrases[phrase.value] = {
            matches: [match],
            score,
            stems,
            weight: score
          }
        }
      }
    }
  }

  /** @type {string} */
  let stemmedPhrase

  for (stemmedPhrase in stemmedPhrases) {
    if (Object.hasOwn(stemmedPhrases, stemmedPhrase)) {
      const phrase = stemmedPhrases[stemmedPhrase]

      // Modify its score to be the rounded result of multiplying it with the
      // number of occurances, and dividing it by the ammount of words in the
      // phrase.
      phrase.score = Math.round(
        (phrase.score * phrase.matches.length) / phrase.stems.length
      )
    }
  }

  return filterResults(stemmedPhrases, maximum)
}

/**
 * Check if `node` is important.
 *
 * @param {Readonly<SentenceContent>} node
 *   Node.
 * @returns {boolean}
 *   Whether `node` is important.
 */
function important(node) {
  return Boolean(
    node &&
      node.data &&
      'partOfSpeech' in node.data &&
      typeof node.data.partOfSpeech === 'string' &&
      (node.data.partOfSpeech.indexOf('N') === 0 ||
        (node.data.partOfSpeech === 'JJ' &&
          uppercase(toString(node).charAt(0))))
  )
}

/**
 * Merge a previous array, with a current value, and a following array.
 *
 * @template T
 *   Item kind.
 * @param {ReadonlyArray<T>} previous
 *   Previous.
 * @param {T} current
 *   Current.
 * @param {ReadonlyArray<T>} next
 *   Next.
 * @returns {Array<T>}
 *   Result.
 */
function merge(previous, current, next) {
  return [...[...previous].reverse(), current, ...next]
}

/**
 * Get the stem of a node.
 *
 * @param {Readonly<SentenceContent>} node
 *   Node.
 * @returns {string}
 *   Stem.
 */
function stemNode(node) {
  return stemmer(toString(node)).toLowerCase()
}

/**
 * Check if `value` is uppercase.
 *
 * @param {string} value
 *   Value.
 * @returns {boolean}
 *   Whether `value` is uppercase.
 */
function uppercase(value) {
  return value === String(value).toUpperCase()
}

/**
 * @param {Record<string, Keyword>} keywords
 * @returns {Record<string, Keyword>}
 */
function cloneKeywords(keywords) {
  /** @type {Record<string, Keyword>} */
  const cloned = {}
  /** @type {string} */
  let key

  for (key in keywords) {
    if (Object.hasOwn(keywords, key)) {
      const keyword = keywords[key]
      cloned[key] = {
        ...keyword,
        matches: [...keyword.matches]
      }
    }
  }

  return cloned
}
