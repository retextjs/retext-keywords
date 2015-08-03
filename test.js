'use strict';

/* eslint-env mocha */

/*
 * Dependencies.
 */

var assert = require('assert');
var retext = require('retext');
var keywords = require('./');

/*
 * Methods.
 */

var equal = assert.strictEqual;

/*
 * Fixture.
 *
 * First three paragraphs on Term Extraction from Wikipedia:
 * http://en.wikipedia.org/wiki/Terminology_extraction
 */

var fixture = 'Terminology mining, term extraction, term recognition, or ' +
    'glossary extraction, is a subtask of information extraction. ' +
    'The goal of terminology extraction is to automatically extract ' +
    'relevant terms from a given corpus.' +
    '\n\n' +
    'In the semantic web era, a growing number of communities and ' +
    'networked enterprises started to access and interoperate through ' +
    'the internet. Modeling these communities and their information ' +
    'needs is important for several web applications, like ' +
    'topic-driven web crawlers, web services, recommender systems, ' +
    'etc. The development of terminology extraction is essential to ' +
    'the language industry.' +
    '\n\n' +
    'One of the first steps to model the knowledge domain of a ' +
    'virtual community is to collect a vocabulary of domain-relevant ' +
    'terms, constituting the linguistic surface manifestation of ' +
    'domain concepts. Several methods to automatically extract ' +
    'technical terms from domain-specific document warehouses have ' +
    'been described in the literature.' +
    '\n\n' +
    'Typically, approaches to automatic term extraction make use of ' +
    'linguistic processors (part of speech tagging, phrase chunking) ' +
    'to extract terminological candidates, i.e. syntactically ' +
    'plausible terminological noun phrases, NPs (e.g. compounds ' +
    '"credit card", adjective-NPs "local tourist information office", ' +
    'and prepositional-NPs "board of directors" - in English, the ' +
    'first two constructs are the most frequent). Terminological ' +
    'entries are then filtered from the candidate list using ' +
    'statistical and machine learning methods. Once filtered, ' +
    'because of their low ambiguity and high specificity, these terms ' +
    'are particularly useful for conceptualizing a knowledge domain ' +
    'or for supporting the creation of a domain ontology. Furthermore, ' +
    'terminology extraction is a very useful starting point for ' +
    'semantic similarity, knowledge management, human translation ' +
    'and machine translation, etc.';

var keyScores = [1, 1, 0.71, 0.57, 0.57];
var phraseScores = [1, 0.55, 0.53, 0.24, 0.18];

/*
 * Tests.
 */

describe('pos()', function () {
    retext().use(keywords).process(fixture, function (err, file) {
        it('should not fail', function (done) {
            done(err);
        });

        var namespace = file.namespace('retext');

        it('should work', function () {
            assert('keywords' in namespace);
            assert('keyphrases' in namespace);

            equal(namespace.keywords.length, 5);
            equal(namespace.keyphrases.length, 5);
        });

        it('should have scores', function () {
            namespace.keywords.forEach(function (keyword, n) {
                equal(Math.round(keyword.score * 1e2) / 1e2, keyScores[n]);
            });

            namespace.keyphrases.forEach(function (phrase, n) {
                equal(Math.round(phrase.score * 1e2) / 1e2, phraseScores[n]);
            });
        });

        it('should have stems', function () {
            namespace.keywords.forEach(function (keyword) {
                assert('stem' in keyword);
            });

            namespace.keyphrases.forEach(function (phrase) {
                assert('stems' in phrase);
            });
        });

        it('should have matches', function () {
            namespace.keywords.forEach(function (keyword) {
                assert('matches' in keyword);
            });

            namespace.keyphrases.forEach(function (phrase) {
                assert('matches' in phrase);
            });
        });

        describe('keywords[n].matches[n]', function () {
            it('should have node, index, and parent', function () {
                namespace.keywords.forEach(function (keyword) {
                    keyword.matches.forEach(function (match) {
                        assert('node' in match);
                        assert('parent' in match);
                        assert('index' in match);
                    });
                });
            });
        })

        describe('keyphrases', function () {
            it('should have a weight', function () {
                namespace.keyphrases.forEach(function (phrase) {
                    assert('weight' in phrase);
                });
            });

            it('should have a value', function () {
                namespace.keyphrases.forEach(function (phrase) {
                    assert('value' in phrase);
                });
            });
        })

        describe('keyphrases[n].matches[n]', function () {
            it('should have nodes and parent', function () {
                namespace.keyphrases.forEach(function (phrase) {
                    phrase.matches.forEach(function (match) {
                        assert('nodes' in match);
                        assert('parent' in match);
                    });
                });
            });
        })
    });
});
