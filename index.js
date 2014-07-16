'use strict';

var pos = require('retext-pos'),
    stemmer = require('retext-porter-stemmer'),
    visit = require('retext-visit');

exports = module.exports = function () {};

function reverseSort(a, b) {
    return b - a;
}

function interpolate(value, min, max) {
    return min + value * (max - min);
}

function filterResults(results, minimum) {
    var filteredResults = [],
        matrix = {},
        indices = [],
        column, key, score, interpolatedScore, iterator, otherIterator,
        maxScore;

    for (key in results) {
        score = results[key].score;

        if (!(score in matrix)) {
            matrix[score] = [];
            indices.push(score);
        }

        matrix[score].push(results[key]);
    }

    indices.sort(reverseSort);
    maxScore = indices[0];

    iterator = -1;

    while (indices[++iterator]) {
        score = indices[iterator];
        column = matrix[score];

        interpolatedScore = interpolate(score / maxScore, 0, 1);
        otherIterator = -1;

        while (column[++otherIterator]) {
            column[otherIterator].score = interpolatedScore;
        }

        filteredResults = filteredResults.concat(column);

        if (filteredResults.length >= minimum) {
            break;
        }
    }

    return filteredResults;
}

function isKeyWord(node) {
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

function getKeywords(node) {
    var keywords = {};

    node.visitType(node.WORD_NODE, function (word) {
        var stem;

        if (isKeyWord(word)) {
            stem = word.data.stem.toLowerCase();

            if (!(stem in keywords)) {
                keywords[stem] = {
                    'nodes' : [word],
                    'stem' : stem,
                    'score' : 1
                };
            } else {
                keywords[stem].nodes.push(word);
                keywords[stem].score++;
            }
        }
    });

    return keywords;
}

function getFilteredKeywords(options) {
    if (!options) {
        options = {};
    }

    return filterResults(
        getKeywords(this),
        'minimum' in options ? options.minimum : 5
    );
}

function findPhraseInDirection(node, property) {
    var nodes = [], stems = [], words = [], queue = [];

    node = node[property];

    while (node) {
        if (node.type === node.WHITE_SPACE_NODE) {
            queue.push(node);
        } else if (isKeyWord(node)) {
            nodes = nodes.concat(queue, [node]);
            words.push(node);
            stems.push(node.data.stem.toLowerCase());
            queue = [];
        } else {
            break;
        }

        node = node[property];
    }

    return {
        'stems' : stems,
        'words' : words,
        'nodes' : nodes
    };
}

function merge(prev, value, next) {
    return prev.reverse().concat([value], next);
}

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

function getKeyphrases(options) {
    var simplePhrases = {},
        initialWords = [],
        simplePhrase, iterator, otherIterator, keywords, keyword, nodes,
        phrase, stems, score;

    if (!options) {
        options = {};
    }

    keywords = getKeywords(this);

    /* Iterate over all grouped keywords... */
    for (keyword in keywords) {
        nodes = keywords[keyword].nodes;

        iterator = -1;

        /* Iterate over every occurence of a certain keyword... */
        while (nodes[++iterator]) {
            /* Detect the phrase the node is in. */
            phrase = findPhrase(nodes[iterator]);

            /* If we've already detected the same (simplified) phrase
             * somewhere... */
            if (phrase.value in simplePhrases) {
                simplePhrase = simplePhrases[phrase.value];

                /* Add weight per phrase to the score of the phrase. */
                simplePhrase.score += simplePhrase.weight;

                /* If this is the first time we walk over the phrase (exact
                 * match, at another position), add it to the list of
                 * matching phrases. */
                if (initialWords.indexOf(phrase.nodes[0]) === -1) {
                    initialWords.push(phrase.nodes[0]);
                    simplePhrase.nodes.push(phrase.nodes);
                }
            /* Otherwise... */
            } else {
                otherIterator = -1;
                score = -1;
                stems = phrase.stems;
                initialWords.push(phrase.nodes[0]);

                /* For every stem in phrase, add its score to score. */
                while (stems[++otherIterator]) {
                    score += keywords[stems[otherIterator]].score;
                }

                simplePhrases[phrase.value] = {
                    'score' : score,
                    'weight' : score,
                    'stems' : stems,
                    'value' : phrase.value,
                    'nodes' : [phrase.nodes]
                };
            }
        }
    }

    /* Iterate over all grouped phrases... */
    for (simplePhrase in simplePhrases) {
        phrase = simplePhrases[simplePhrase];

        /* Modify its score to be the rounded result of multiplying it with
         * the number of occurances, and dividing it by the ammount of words
         * in the phrase. */
        phrase.score = Math.round(
            phrase.score * phrase.nodes.length / phrase.stems.length
        );
    }

    return filterResults(
        simplePhrases,
        'minimum' in options ? options.minimum : 5
    );
}

function attach(retext) {
    var TextOM = retext.parser.TextOM;

    retext.use(stemmer).use(pos).use(visit);

    TextOM.Parent.prototype.keywords = TextOM.Element.prototype.keywords =
        getFilteredKeywords;

    TextOM.Parent.prototype.keyphrases = TextOM.Element.prototype.keyphrases =
        getKeyphrases;
}

exports.attach = attach;
