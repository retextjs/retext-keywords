'use strict';

var Retext, retext, keywords, source,
    sourceSmall, sourceMedium,
    tiny, small, medium,
    wordCount, sentenceCount, paragraphCount;

Retext = require('retext');
keywords = require('..');

/* First paragraph on term extraction from Wikipedia:
 * http://en.wikipedia.org/wiki/Terminology_extraction
 */
source = 'Terminology mining, term extraction, term recognition, or ' +
    'glossary extraction, is a subtask of information extraction. ' +
    'The goal of terminology extraction is to automatically extract ' +
    'relevant terms from a given corpus.\n\n';

/* Test data */
sourceSmall = Array(11).join(source);
sourceMedium = Array(11).join(sourceSmall);

retext = new Retext().use(keywords);

tiny = retext.parse(source);
small = retext.parse(sourceSmall);
medium = retext.parse(sourceMedium);

wordCount = sentenceCount = paragraphCount = 0;

tiny.visitType(tiny.WORD_NODE, function () {
    wordCount++;
});

tiny.visitType(tiny.SENTENCE_NODE, function () {
    sentenceCount++;
});

tiny.visitType(tiny.PARAGRAPH_NODE, function () {
    paragraphCount++;
});

if (wordCount !== 30) {
    console.error('Word count should be 300!');
}

if (sentenceCount !== 2) {
    console.error('Sentence count should be 300!');
}

if (paragraphCount !== 1) {
    console.error('Paragraph count should be 300!');
}

/* Benchmarks */
suite('Finding keywords in English', function () {
    bench('small (10 paragraphs, 20 sentences, 300 words)', function () {
        small.keywords();
    });

    bench('medium (100 paragraphs, 200 sentences, 3000 words)', function () {
        medium.keywords();
    });
});

/* Benchmarks */
suite('Finding keyphrases in English', function () {
    bench('small (10 paragraphs, 20 sentences, 300 words)', function () {
        small.keyphrases();
    });

    bench('medium (100 paragraphs, 200 sentences, 3000 words)', function () {
        medium.keyphrases();
    });
});
