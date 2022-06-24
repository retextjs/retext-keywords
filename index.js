/**
 * @typedef {import('./complex-types.js')} DoNotTouchAsThisIncludesVFileData
 *
 * @typedef {import('nlcst').Root} Root
 * @typedef {import('nlcst').Sentence} Sentence
 * @typedef {import('nlcst').Word} Word
 * @typedef {import('nlcst').SentenceContent} SentenceContent
 *
 * @typedef Options
 *   Configuration.
 * @property {number} [maximum=5]
 *   Try to detect at most `maximum` `words` and `phrases`.
 *
 *   Note that actual counts may differ.
 *   For example, when two words have the same score, both will be returned.
 *   Or when too few words exist, less will be returned. the same goes for
 *   phrases.
 *
 * @typedef Keyphrase
 * @property {number} score
 * @property {number} weight
 * @property {Array<string>} stems
 * @property {string} value
 * @property {Array<PhraseMatch>} matches
 *
 * @typedef Keyword
 * @property {Array<WordMatch>} matches
 * @property {number} score
 * @property {string} stem
 *
 * @typedef PhraseMatch
 * @property {Array<SentenceContent>} nodes
 * @property {Sentence} parent
 *
 * @typedef WordMatch
 * @property {Word} node
 * @property {number} index
 * @property {Sentence} parent
 *
 * @typedef {WordMatch} KeywordMatch
 *   To do: deprecate next major, use `WordMatch` instead.
 */

import {stemmer} from 'stemmer'
import {visit} from 'unist-util-visit'
import {toString} from 'nlcst-to-string'

const own = {}.hasOwnProperty

/**
 * Plugin to extract keywords and key-phrases.
 *
 * @type {import('unified').Plugin<[Options?]|[], Root>}
 */
export default function retextKeywords(options = {}) {
  const maximum = options.maximum || 5

  return (tree, file) => {
    const important = getImportantWords(tree)
    file.data.keywords = filterResults(cloneMatches(important), maximum)
    file.data.keyphrases = getKeyphrases(important, maximum)
  }
}

/**
 * Get following or preceding important words or white space.
 *
 * @param {Sentence} parent
 * @param {number} index
 * @param {number} offset
 */
function findPhraseInDirection(parent, index, offset) {
  const children = parent.children
  /** @type {Array<SentenceContent>} */
  const nodes = []
  /** @type {Array<string>} */
  const stems = []
  /** @type {Array<SentenceContent>} */
  const queue = []

  while (children[(index += offset)]) {
    const child = children[index]

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
 * Get the top important phrases.
 *
 * @param {Record<string, Keyword>} results
 * @param {number} maximum
 */
function getKeyphrases(results, maximum) {
  /** @type {Record<string, Keyphrase>} */
  const stemmedPhrases = {}
  /** @type {Array<Word>} */
  const initialWords = []
  /** @type {string} */
  let keyword

  // Iterate over all grouped important words…
  for (keyword in results) {
    if (own.call(results, keyword)) {
      const matches = results[keyword].matches
      let index = -1

      // Iterate over every occurence of a certain keyword…
      while (++index < matches.length) {
        const phrase = findPhrase(matches[index])
        const stemmedPhrase = stemmedPhrases[phrase.value]
        const first = /** @type {Word} */ (phrase.nodes[0])
        const match = {nodes: phrase.nodes, parent: matches[index].parent}

        // If we've detected the same stemmed phrase somewhere.
        if (own.call(stemmedPhrases, phrase.value)) {
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
            score,
            weight: score,
            stems,
            value: phrase.value,
            matches: [match]
          }
        }
      }
    }
  }

  /** @type {string} */
  let stemmedPhrase

  for (stemmedPhrase in stemmedPhrases) {
    if (own.call(stemmedPhrases, stemmedPhrase)) {
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
 * Get the top results from an occurance map.
 *
 * @template {{score: number}} T
 * @param {Record<string, T>} results
 * @param {number} maximum
 * @returns {Array<T>}
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
    if (own.call(results, key)) {
      const score = results[key].score

      if (!own.call(matrix, String(score))) {
        matrix[score] = []
        indices.push(score)
      }

      matrix[score].push(results[key])
    }
  }

  // Reverse sort: from 9 to 0.
  indices.sort((a, b) => b - a)

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
 * @param {WordMatch} match
 */
function findPhrase(match) {
  const previous = findPhraseInDirection(match.parent, match.index, -1)
  const next = findPhraseInDirection(match.parent, match.index, 1)
  const stems = merge(previous.stems, stemNode(match.node), next.stems)

  return {
    stems,
    value: stems.join(' '),
    nodes: merge(previous.nodes, match.node, next.nodes)
  }
}

/**
 * Merge a previous array, with a current value, and a following array.
 *
 * @template T
 * @param {Array<T>} previous
 * @param {T} current
 * @param {Array<T>} next
 * @returns {Array<T>}
 */
function merge(previous, current, next) {
  return [...[...previous].reverse(), current, ...next]
}

/**
 * Get most important words in `node`.
 *
 * @param {Root} node
 */
function getImportantWords(node) {
  /** @type {Record<string, Keyword>} */
  const words = {}

  visit(node, 'WordNode', (word, index, parent_) => {
    const parent = /** @type {Sentence} */ (parent_)
    if (parent && index !== null && important(word)) {
      const stem = stemNode(word)
      const match = {node: word, index, parent}

      if (own.call(words, stem)) {
        words[stem].matches.push(match)
        words[stem].score++
      } else {
        words[stem] = {matches: [match], stem, score: 1}
      }
    }
  })

  return words
}

/**
 * Clone the given map of words.
 * This is a two level-deep clone.
 *
 * @param {Record<string, Keyword>} words
 * @returns {Record<string, Keyword>}
 */
function cloneMatches(words) {
  /** @type {Record<string, Keyword>} */
  const result = {}
  /** @type {string} */
  let key

  for (key in words) {
    if (own.call(words, key)) {
      const {matches, stem, score} = words[key]
      result[key] = {matches, stem, score}
    }
  }

  return result
}

/**
 * Check if `node` is important.
 *
 * @param {SentenceContent} node
 * @returns {boolean}
 */
function important(node) {
  return Boolean(
    node &&
      node.data &&
      typeof node.data.partOfSpeech === 'string' &&
      (node.data.partOfSpeech.indexOf('N') === 0 ||
        (node.data.partOfSpeech === 'JJ' &&
          uppercase(toString(node).charAt(0))))
  )
}

/**
 * Check if `value` is upper-case.
 *
 * @param {string} value
 * @returns {boolean}
 */
function uppercase(value) {
  return value === String(value).toUpperCase()
}

/**
 * Get the stem of a node.
 *
 * @param {SentenceContent} node
 * @returns {string}
 */
function stemNode(node) {
  return stemmer(toString(node)).toLowerCase()
}
