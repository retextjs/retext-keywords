'use strict';

/**
 * Dependencies.
 */

var Retext,
    keywords;

Retext = require('retext');
keywords = require('./');

/**
 * Fixtures.
 *
 * First paragraph on term extraction from Wikipedia:
 *
 *   http://en.wikipedia.org/wiki/Terminology_extraction
 */

var source,
    sourceSmall,
    sourceMedium;

source =
    'Terminology mining, term extraction, term recognition, or ' +
    'glossary extraction, is a subtask of information extraction. ' +
    'The goal of terminology extraction is to automatically extract ' +
    'relevant terms from a given corpus.\n\n';

sourceSmall = Array(11).join(source);
sourceMedium = Array(11).join(sourceSmall);

/**
 * Retext.
 */

var retext;

retext = new Retext().use(keywords);

/**
 * Benchmarks.
 */

suite('A big section (10 paragraphs)', function () {
    var tree;

    before(function (next) {
        retext.parse(sourceSmall, function (err, node) {
            if (err) {
                throw err;
            }

            tree = node;

            next();
        });
    });

    bench('Finding keywords', function () {
        tree.keywords();
    });

    bench('Finding keyphrases', function () {
        tree.keyphrases();
    });
});

suite('A big article (100 paragraphs)', function () {
    var tree;

    before(function (next) {
        retext.parse(sourceMedium, function (err, node) {
            if (err) {
                throw err;
            }

            tree = node;

            next();
        });
    });

    bench('Finding keywords', function () {
        tree.keywords();
    });

    bench('Finding keyphrases', function () {
        tree.keyphrases();
    });
});
