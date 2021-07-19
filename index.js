import {stemmer} from 'stemmer'
import {visit} from 'unist-util-visit'
import {toString} from 'nlcst-to-string'

const own = {}.hasOwnProperty

export default function retextKeywords(options = {}) {
  const maximum = options.maximum || 5

  return (tree, file) => {
    const important = getImportantWords(tree)
    file.data.keywords = filterResults(cloneMatches(important), maximum)
    file.data.keyphrases = getKeyphrases(important, maximum)
  }
}

// Get following or preceding important words or white space.
function findPhraseInDirection(node, index, parent, offset) {
  const children = parent.children
  const nodes = []
  const stems = []
  const words = []
  const queue = []

  while (children[(index += offset)]) {
    const child = children[index]

    if (child.type === 'WhiteSpaceNode') {
      queue.push(child)
    } else if (important(child)) {
      nodes.push(...queue, child)
      words.push(child)
      stems.push(stemNode(child))
      queue.length = 0
    } else {
      break
    }
  }

  return {stems, words, nodes}
}

// Get the top important phrases.
function getKeyphrases(results, maximum) {
  const stemmedPhrases = {}
  const initialWords = []
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
        const first = phrase.nodes[0]
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

// Get the top results from an occurance map.
function filterResults(results, maximum) {
  const filteredResults = []
  const indices = []
  const matrix = {}
  let key

  for (key in results) {
    if (own.call(results, key)) {
      const score = results[key].score

      if (!matrix[score]) {
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

// Merge a previous array, with a current value, and a following array.
function merge(previous, current, next) {
  return [].concat(previous.concat().reverse(), current, next)
}

// Find the phrase surrounding a node.
function findPhrase(match) {
  const previous = findPhraseInDirection(
    match.node,
    match.index,
    match.parent,
    -1
  )
  const next = findPhraseInDirection(match.node, match.index, match.parent, 1)
  const stems = merge(previous.stems, stemNode(match.node), next.stems)

  return {
    stems,
    value: stems.join(' '),
    nodes: merge(previous.nodes, match.node, next.nodes)
  }
}

// Get most important words in `node`.
function getImportantWords(node) {
  const words = {}

  visit(node, 'WordNode', (word, index, parent) => {
    if (important(word)) {
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

// Clone the given map of words.
// This is a two level-deep clone.
function cloneMatches(words) {
  const result = {}
  let key

  for (key in words) {
    if (own.call(words, key)) {
      const {matches, stem, score} = words[key]
      result[key] = {matches, stem, score}
    }
  }

  return result
}

// Check if `node` is important.
function important(node) {
  return (
    node &&
    node.data &&
    node.data.partOfSpeech &&
    (node.data.partOfSpeech.indexOf('N') === 0 ||
      (node.data.partOfSpeech === 'JJ' && uppercase(toString(node).charAt(0))))
  )
}

// Check if `value` is upper-case.
function uppercase(value) {
  return value === String(value).toUpperCase()
}

// Get the stem of a node.
function stemNode(node) {
  return stemmer(toString(node)).toLowerCase()
}
