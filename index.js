'use strict';

/**
 * Module dependencies.
 */

var pos,
    stemmer,
    visit;

pos = require('retext-pos');
stemmer = require('retext-porter-stemmer');
visit = require('retext-visit');

/**
 * Constants.
 */

var has;

has = Object.prototype.hasOwnProperty;

/**
 * Define `keywords`.
 */

function keywords() {}

/**
 * Reverse sort: from 9 to 0.
 *
 * @param {number} a
 * @param {number} b
 */

function reverseSort(a, b) {
    return b - a;
}

/**
 * Get the top results from an occurance map.
 *
 * @param {Object.<string, Object>} results - Dictionary of
 *   stems mapping to objects containing `nodes`, `stem`,
 *   and `score` properties.
 * @param {number} minimum - Minimum number of results to
 *   return.
 * @return {Array.<Object>}
 */

function filterResults(results, minimum) {
    var filteredResults,
        matrix,
        indices,
        column,
        key,
        score,
        interpolatedScore,
        index,
        otherIndex,
        maxScore;

    filteredResults = [];
    indices = [];
    matrix = {};

    for (key in results) {
        score = results[key].score;

        if (!has.call(matrix, score)) {
            matrix[score] = [];
            indices.push(score);
        }

        matrix[score].push(results[key]);
    }

    indices.sort(reverseSort);

    maxScore = indices[0];

    index = -1;

    while (indices[++index]) {
        score = indices[index];
        column = matrix[score];

        interpolatedScore = score / maxScore;
        otherIndex = -1;

        while (column[++otherIndex]) {
            column[otherIndex].score = interpolatedScore;
        }

        filteredResults = filteredResults.concat(column);

        if (filteredResults.length >= minimum) {
            break;
        }
    }

    return filteredResults;
}

/**
 * Get whether or not a `node` is important.
 *
 * @param {Node} node
 * @return {boolean}
 */

function isImportant(node) {
    return (
        node &&
        node.type === 'WordNode' &&
        (
            node.data.partOfSpeech.indexOf('N') === 0 ||
            (
                node.data.partOfSpeech === 'JJ' &&
                node.toString().charAt(0).match(/[A-Z]/)
            )
        )
    );
}

/**
 * Get most important words in `node`.
 *
 * @param {Node} node
 * @return {Array.<Object>}
 */

function getImportantWords(node) {
    var importantWords;

    importantWords = {};

    node.visit(node.WORD_NODE, function (word) {
        var stem;

        if (isImportant(word)) {
            stem = word.data.stem.toLowerCase();

            if (!has.call(importantWords, stem)) {
                importantWords[stem] = {
                    'nodes' : [word],
                    'stem' : stem,
                    'score' : 1
                };
            } else {
                importantWords[stem].nodes.push(word);
                importantWords[stem].score++;
            }
        }
    });

    return importantWords;
}

/**
 * Get the top important words in `self`.
 *
 * @param {Object?} options
 * @param {number?} options.minimum
 * @this {Node} node
 * @return {Array.<Object>}
 */

function getKeywords(options) {
    var minimum;

    minimum = options && has.call(options, 'minimum') ? options.minimum : 5;

    return filterResults(getImportantWords(this), minimum);
}

/**
 * Get following or preceding important words or white space.
 *
 * @param {Node} node
 * @param {string} direction - either "prev" or "next".
 * @return {Object}
 */

function findPhraseInDirection(node, direction) {
    var nodes,
        stems,
        words,
        queue;

    nodes = [];
    stems = [];
    words = [];
    queue = [];

    node = node[direction];

    while (node) {
        if (node.type === node.WHITE_SPACE_NODE) {
            queue.push(node);
        } else if (isImportant(node)) {
            nodes = nodes.concat(queue, [node]);
            words.push(node);
            stems.push(node.data.stem.toLowerCase());
            queue = [];
        } else {
            break;
        }

        node = node[direction];
    }

    return {
        'stems' : stems,
        'words' : words,
        'nodes' : nodes
    };
}

/**
 * Merge a previous array, with a current value, and
 * a following array.
 *
 * @param {Array.<*>} prev
 * @param {*} current
 * @param {Array.<*>} next
 * @return {Array.<*>}
 */

function merge(prev, current, next) {
    return prev.reverse().concat([current], next);
}

/**
 * Find the phrase surrounding a node.
 *
 * @param {Node} node
 * @return {Object}
 */

function findPhrase(node) {
    var prev = findPhraseInDirection(node, 'prev'),
        next = findPhraseInDirection(node, 'next'),
        stems = merge(prev.stems, node.data.stem.toLowerCase(), next.stems);

    return {
        'stems' : stems,
        'value' : stems.join(' ').toLowerCase(),
        'nodes' : merge(prev.nodes, node, next.nodes)
    };
}

/**
 * Get the top important phrases in `self`.
 *
 * @param {Object?} options
 * @param {number?} options.minimum
 * @this {Node} node
 * @return {Array.<Object>}
 */

function getKeyphrases(options) {
    var stemmedPhrases,
        initialWords,
        stemmedPhrase,
        index,
        otherIndex,
        importantWords,
        keyword,
        nodes,
        phrase,
        stems,
        minimum,
        score;

    stemmedPhrases = {};
    initialWords = [];

    minimum = options && has.call(options, 'minimum') ? options.minimum : 5;

    importantWords = getImportantWords(this);

    /**
     * Iterate over all grouped important words...
     */

    for (keyword in importantWords) {
        nodes = importantWords[keyword].nodes;

        index = -1;

        /**
         * Iterate over every occurence of a certain keyword...
         */

        while (nodes[++index]) {
            phrase = findPhrase(nodes[index]);

            /**
             * If we've detected the same stemmed
             * phrase somewhere.
             */

            if (has.call(stemmedPhrases, phrase.value)) {
                stemmedPhrase = stemmedPhrases[phrase.value];

                /**
                 * Add weight per phrase to the score of
                 * the phrase.
                 */

                stemmedPhrase.score += stemmedPhrase.weight;

                /**
                 * If this is the first time we walk over
                 * the phrase (exact match but containing
                 * another important word), add it to the
                 * list of matching phrases.
                 */

                if (initialWords.indexOf(phrase.nodes[0]) === -1) {
                    initialWords.push(phrase.nodes[0]);
                    stemmedPhrase.nodes.push(phrase.nodes);
                }
            } else {
                otherIndex = -1;
                score = -1;
                stems = phrase.stems;

                initialWords.push(phrase.nodes[0]);

                /**
                 * For every stem in phrase, add its
                 * score to score.
                 */

                while (stems[++otherIndex]) {
                    score += importantWords[stems[otherIndex]].score;
                }

                stemmedPhrases[phrase.value] = {
                    'score' : score,
                    'weight' : score,
                    'stems' : stems,
                    'value' : phrase.value,
                    'nodes' : [phrase.nodes]
                };
            }
        }
    }

    for (stemmedPhrase in stemmedPhrases) {
        phrase = stemmedPhrases[stemmedPhrase];

        /**
         * Modify its score to be the rounded result of
         * multiplying it with the number of occurances,
         * and dividing it by the ammount of words in the
         * phrase.
         */

        phrase.score = Math.round(
            phrase.score * phrase.nodes.length / phrase.stems.length
        );
    }

    return filterResults(stemmedPhrases, minimum);
}

/**
 * Define `attach`.
 *
 * @param {Retext}
 */

function attach(retext) {
    var TextOM,
        parentPrototype,
        elementPrototype;

    TextOM = retext.TextOM;
    parentPrototype = TextOM.Parent.prototype;
    elementPrototype = TextOM.Element.prototype;

    retext
        .use(stemmer)
        .use(pos)
        .use(visit);

    parentPrototype.keywords = getKeywords;
    elementPrototype.keywords = getKeywords;

    parentPrototype.keyphrases = getKeyphrases;
    elementPrototype.keyphrases = getKeyphrases;
}

/**
 * Expose `attach`.
 */

keywords.attach = attach;

/**
 * Expose `keywords`.
 */

module.exports = keywords;
