/**
 * @author Titus Wormer
 * @copyright 2014-2015 Titus Wormer
 * @license MIT
 * @module retext:keywords
 * @fileoverview Keyword extraction with Retext.
 */

'use strict';

/*
 * Dependencies.
 */

var stemmer = require('stemmer');
var visit = require('unist-util-visit');
var nlcstToString = require('nlcst-to-string');
var pos = require('retext-pos');

/**
 * Get the stem of a node.
 *
 * @param {Node} node - Node to stem.
 * @return {string} - Stemmed node.
 */
function stemNode(node) {
    return stemmer(nlcstToString(node)).toLowerCase();
}

/**
 * Check whether `value` is upper-case.
 *
 * @param {string} value - Value to check.
 * @return {boolean} - Whether `value` is upper-case.
 */
function isUpperCase(value) {
    return value === String(value).toUpperCase();
}

/**
 * Reverse sort: from 9 to 0.
 *
 * @param {number} a - First.
 * @param {number} b - Second.
 * @return {number} - Difference.
 */
function reverse(a, b) {
    return b - a;
}

/**
 * Check whether or not a `node` is important.
 *
 * @param {Node} node - Node to check.
 * @return {boolean} - Whether `node` is important.
 */
function isImportant(node) {
    return (
        node &&
        node.data &&
        node.data.partOfSpeech &&
        (
            node.data.partOfSpeech.indexOf('N') === 0 ||
            (
                node.data.partOfSpeech === 'JJ' &&
                isUpperCase(nlcstToString(node).charAt(0))
            )
        )
    );
}

/**
 * Get most important words in `node`.
 *
 * @param {Node} node - Parent to search in.
 * @return {Array.<Object>}
 */
function getImportantWords(node) {
    var words = {};

    visit(node, 'WordNode', function (word, index, parent) {
        var match;
        var stem;

        if (isImportant(word)) {
            stem = stemNode(word);
            match = {
                'node': word,
                'index': index,
                'parent': parent
            };

            if (!words[stem]) {
                words[stem] = {
                    'matches': [match],
                    'stem': stem,
                    'score': 1
                };
            } else {
                words[stem].matches.push(match);
                words[stem].score++;
            }
        }
    });

    return words;
}

/**
 * Get the top results from an occurance map.
 *
 * @param {Object.<string, Object>} results - Map of stems
 *   mapping to objects containing `nodes`, `stem`, and
 *   `score` properties.
 * @param {number} maximum - Try to get at least `maximum`
 *   results.
 * @return {Array.<Object>}
 */
function filterResults(results, maximum) {
    var filteredResults = [];
    var indices = [];
    var matrix = {};
    var column;
    var key;
    var score;
    var interpolated;
    var index;
    var otherIndex;
    var maxScore;

    for (key in results) {
        score = results[key].score;

        if (!matrix[score]) {
            matrix[score] = [];
            indices.push(score);
        }

        matrix[score].push(results[key]);
    }

    indices.sort(reverse);

    maxScore = indices[0];

    index = -1;

    while (indices[++index]) {
        score = indices[index];
        column = matrix[score];

        interpolated = score / maxScore;
        otherIndex = -1;

        while (column[++otherIndex]) {
            column[otherIndex].score = interpolated;
        }

        filteredResults = filteredResults.concat(column);

        if (filteredResults.length >= maximum) {
            break;
        }
    }

    return filteredResults;
}

/**
 * Get following or preceding important words or white space.
 *
 * @param {Node} node - Node to start search at.
 * @param {number} index - Position of `node` in `parent`.
 * @param {Node} parent - Parent of `node`.
 * @param {number} offset - Offset to the next node. `-1`
 *   when iterating backwards, `1` when iterating forwards.
 * @return {Object}
 */
function findPhraseInDirection(node, index, parent, offset) {
    var children = parent.children;
    var nodes = [];
    var stems = [];
    var words = [];
    var queue = [];
    var child;

    while (children[index += offset]) {
        child = children[index];

        if (child.type === 'WhiteSpaceNode') {
            queue.push(child);
        } else if (isImportant(child)) {
            nodes = nodes.concat(queue, [child]);
            words.push(child);
            stems.push(stemNode(child));
            queue = [];
        } else {
            break;
        }
    }

    return {
        'stems': stems,
        'words': words,
        'nodes': nodes
    };
}

/**
 * Merge a previous array, with a current value, and
 * a following array.
 *
 * @param {Array.<*>} prev - Reversed array before `current`.
 * @param {*} current - Current thing.
 * @param {Array.<*>} next - Things after `current`.
 * @return {Array.<*>}
 */
function merge(prev, current, next) {
    return prev.concat().reverse().concat([current], next);
}

/**
 * Find the phrase surrounding a node.
 *
 * @param {Object} match - Single match.
 * @return {Object}
 */
function findPhrase(match) {
    var node = match.node;
    var prev = findPhraseInDirection(node, match.index, match.parent, -1);
    var next = findPhraseInDirection(node, match.index, match.parent, 1);
    var stems = merge(prev.stems, stemNode(node), next.stems);

    return {
        'stems': stems,
        'value': stems.join(' '),
        'nodes': merge(prev.nodes, node, next.nodes)
    };
}

/**
 * Get the top important phrases in `self`.
 *
 * @param {Object.<string, Object>} results - Map of stems
 *   mapping to objects containing `nodes`, `stem`, and
 *   `score` properties.
 * @param {number} maximum - Try to get at least `maximum`
 *   results.
 * @return {Array.<Object>}
 */
function getKeyphrases(results, maximum) {
    var stemmedPhrases = {};
    var initialWords = [];
    var stemmedPhrase;
    var index;
    var length;
    var otherIndex;
    var keyword;
    var matches;
    var phrase;
    var stems;
    var score;
    var first;
    var match;

    /*
     * Iterate over all grouped important words...
     */

    for (keyword in results) {
        matches = results[keyword].matches;
        length = matches.length;
        index = -1;

        /*
         * Iterate over every occurence of a certain keyword...
         */

        while (++index < length) {
            phrase = findPhrase(matches[index]);
            stemmedPhrase = stemmedPhrases[phrase.value];
            first = phrase.nodes[0];

            match = {
                'nodes': phrase.nodes,
                'parent': matches[index].parent
            };

            /*
             * If we've detected the same stemmed
             * phrase somewhere.
             */

            if (stemmedPhrase) {
                /*
                 * Add weight per phrase to the score of
                 * the phrase.
                 */

                stemmedPhrase.score += stemmedPhrase.weight;

                /*
                 * If this is the first time we walk over
                 * the phrase (exact match but containing
                 * another important word), add it to the
                 * list of matching phrases.
                 */

                if (initialWords.indexOf(first) === -1) {
                    initialWords.push(first);
                    stemmedPhrase.matches.push(match);
                }
            } else {
                otherIndex = -1;
                score = -1;
                stems = phrase.stems;

                initialWords.push(first);

                /*
                 * For every stem in phrase, add its
                 * score to score.
                 */

                while (stems[++otherIndex]) {
                    score += results[stems[otherIndex]].score;
                }

                stemmedPhrases[phrase.value] = {
                    'score': score,
                    'weight': score,
                    'stems': stems,
                    'value': phrase.value,
                    'matches': [match]
                };
            }
        }
    }

    for (stemmedPhrase in stemmedPhrases) {
        phrase = stemmedPhrases[stemmedPhrase];

        /*
         * Modify its score to be the rounded result of
         * multiplying it with the number of occurances,
         * and dividing it by the ammount of words in the
         * phrase.
         */

        phrase.score = Math.round(
            phrase.score * phrase.matches.length / phrase.stems.length
        );
    }

    return filterResults(stemmedPhrases, maximum);
}

/**
 * Clone the given map of words.
 *
 * This is a two level-deep clone.
 *
 * @param {Object} words - Important words.
 * @return {Object} - Cloned words.
 */
function cloneMatches(words) {
    var result = {};
    var key;
    var match;

    for (key in words) {
        match = words[key];
        result[key] = {
            'matches': match.matches,
            'stem': match.stem,
            'score': match.score
        }
    }

    return result;
}

/**
 * Attach.
 *
 * @param {Retext} retext - Instance.
 * @param {Object?} [options] - Configuration.
 * @param {number?} [options.maximum] - Try to get at
 *   least `maximum` results.
 * @return {Function} - `transformer`.
 */
function attacher(retext, options) {
    var maximum = (options || {}).maximum || 5;

    retext.use(pos);

    /**
     * Attach keywords in `cst` to `file`.
     *
     * @param {NLCSTNode} cst - Node.
     * @param {VFile} file - Virtual file.
     */
    function transformer(cst, file) {
        var space = file.namespace('retext');
        var important = getImportantWords(cst);

        space.keywords = filterResults(cloneMatches(important), maximum);
        space.keyphrases = getKeyphrases(important, maximum);
    }

    return transformer;
}

/*
 * Expose.
 */

module.exports = attacher;
