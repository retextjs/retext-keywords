'use strict';

/**
 * Module dependencies.
 */

var keywords,
    Retext,
    assert;

keywords = require('./');
Retext = require('retext');
assert = require('assert');

/**
 * Retext.
 */

var retext,
    TextOM;

retext = new Retext().use(keywords);

TextOM = retext.TextOM;

/**
 * Value.
 *
 * First three paragraphs on term extraction from
 * Wikipedia:
 *
 *   http://en.wikipedia.org/wiki/Terminology_extraction
 */

var value;

value =
    'Terminology mining, term extraction, term recognition, or ' +
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

/**
 * Tests.
 */

describe('keywords()', function () {
    it('should be a `function`', function () {
        assert(typeof keywords === 'function');
    });
});

describe('keywords.attach()', function () {
    it('should be a `function`', function () {
        assert(typeof keywords.attach === 'function');
    });
});

describe('TextOM.Parent#keywords(options?)', function () {
    it('should be a `function`', function () {
        assert(typeof TextOM.Parent.prototype.keywords === 'function');
    });

    it('should work', function (done) {
        retext.parse(value, function (err, tree) {
            var terms;

            terms = tree.keywords();

            assert(terms[0].stem === 'terminolog');
            assert(terms[1].stem === 'term');
            assert(terms[2].stem === 'extract');
            assert(terms[3].stem === 'web');
            assert(terms[4].stem === 'domain');

            assert(terms[0].nodes.length === 7);
            assert(terms[1].nodes.length === 7);
            assert(terms[2].nodes.length === 7);
            assert(terms[3].nodes.length === 4);
            assert(terms[4].nodes.length === 4);

            assert(terms.length >= 5);

            done(err);
        });
    });

    it('should accept a `minimum` option', function (done) {
        retext.parse(value, function (err, tree) {
            var terms;

            terms = tree.keywords({
                'minimum' : 7
            });

            assert(terms[0].stem === 'terminolog');
            assert(terms[1].stem === 'term');
            assert(terms[2].stem === 'extract');
            assert(terms[3].stem === 'web');
            assert(terms[4].stem === 'domain');
            assert(terms[5].stem === 'inform');
            assert(terms[6].stem === 'commun');
            assert(terms[7].stem === 'knowledg');

            assert(terms[0].nodes.length === 7);
            assert(terms[1].nodes.length === 7);
            assert(terms[2].nodes.length === 7);
            assert(terms[3].nodes.length === 4);
            assert(terms[4].nodes.length === 4);
            assert(terms[5].nodes.length === 3);
            assert(terms[6].nodes.length === 3);
            assert(terms[7].nodes.length === 3);

            assert(terms.length >= 7);

            done(err);
        });
    });
});

describe('TextOM.Parent#keyphrases(options?)', function () {
    it('should be a `function`', function () {
        assert(typeof TextOM.Parent.prototype.keywords === 'function');
    });

    it('should work', function (done) {
        retext.parse(value, function (err, tree) {
            var phrases;

            phrases = tree.keyphrases();

            assert(phrases[0].value === 'terminolog extract');
            assert(phrases[1].value === 'term');
            assert(phrases[2].value === 'term extract');
            assert(phrases[3].value === 'knowledg domain');
            assert(phrases[4].value === 'commun');

            assert(phrases[0].nodes.length === 3);
            assert(phrases[1].nodes.length === 3);
            assert(phrases[2].nodes.length === 2);
            assert(phrases[3].nodes.length === 2);
            assert(phrases[4].nodes.length === 3);

            assert(phrases.length >= 5);

            done(err);
        });
    });

    it('should accept a `minimum` option', function (done) {
        retext.parse(value, function (err, tree) {
            var phrases;

            phrases = tree.keyphrases({
                'minimum' : 3
            });

            assert(phrases[0].value === 'terminolog extract');
            assert(phrases[1].value === 'term');
            assert(phrases[2].value === 'term extract');

            assert(phrases[0].nodes.length === 3);
            assert(phrases[1].nodes.length === 3);
            assert(phrases[2].nodes.length === 2);

            assert(phrases.length >= 3);

            done(err);
        });
    });
});
