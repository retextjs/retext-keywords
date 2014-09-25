# retext-keywords [![Build Status](https://travis-ci.org/wooorm/retext-keywords.svg?branch=master)](https://travis-ci.org/wooorm/retext-keywords) [![Coverage Status](https://img.shields.io/coveralls/wooorm/retext-keywords.svg)](https://coveralls.io/r/wooorm/retext-keywords?branch=master)

Keyword extraction with **[Retext](https://github.com/wooorm/retext)**.

## Installation

NPM:
```sh
$ npm install retext-keywords
```

Component.js:
```sh
$ component install wooorm/retext-keywords
```

## Usage

```js
var Retext = require('retext'),
    keywords = require('retext-keywords'),
    root;

var root = new Retext()
    .use(keywords)
    .parse(
        /* First three paragraphs on Term Extraction from Wikipedia:
         * http://en.wikipedia.org/wiki/Terminology_extraction */
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
        'and machine translation, etc.'
    );

root.keywords();
/*
 * Array[5]
 * ├─ 0: Object
 * |     ├─ stem: "terminolog"
 * |     ├─ score: 1
 * |     └─ nodes: Array[7]
 * ├─ 1: Object
 * |     ├─ stem: "term"
 * |     ├─ score: 1
 * |     └─ nodes: Array[7]
 * ├─ 2: Object
 * |     ├─ stem: "extract"
 * |     ├─ score: 1
 * |     └─ nodes: Array[7]
 * ├─ 3: Object
 * |     ├─ stem: "web"
 * |     ├─ score: 0.5714285714285714
 * |     └─ nodes: Array[4]
 * └─ 4: Object
 *       ├─ stem: "domain"
 *       ├─ score: 0.5714285714285714
 *       └─ nodes: Array[4]
*/
```

## API
retext-keywords depends on the following plugins:

- [retext-pos](https://github.com/wooorm/retext-pos) — for part-of-speach;
- [retext-porter-stemmer](https://github.com/wooorm/retext-porter-stemmer) — for stemming;
- [retext-visit](https://github.com/wooorm/retext-visit)

### Parent#keywords({minimum=5}?)
Extract keywords, based on how many times they (nouns) occur in text.

```js
// **See above for an example, and output.**

// Do not limit keyword-count.
root.keywords({'minimum' : Infinity});
```

Options:

 * minimum: Return at least (when possible) `minimum` keywords.

Results: An array, containing match-objects:

 * stem: The stem of the word (using [retext-porter-stemm](https://github.com/wooorm/retext-porter-stemmer/));
 * score: A value between 0 and (including) 1. the first match always has a score of 1;
 * nodes: An array containing all matched word nodes.

### Parent#keyphrases({minimum=5}?)
Extract keywords, based on how many times they (nouns) occur in text.

```js
// Do not limit phrase-count.
root.keywords({'minimum' : Infinity});

// Default values:
root.keyphrases();
/*
 * Array[6]
 * ├─ 0: Object
 * |     ├─ stems: Array[2]
 * |     |         ├─ 0: "terminolog"
 * |     |         └─ 1: "extract"
 * |     ├─ score: 1
 * |     └─ nodes: Array[3]
 * ├─ 1: Object
 * |     ├─ stems: Array[1]
 * |     |         └─ 0: "term"
 * |     ├─ score: 0.46153846153846156
 * |     └─ nodes: Array[3]
 * ├─ 2: Object
 * |     ├─ stems: Array[2]
 * |     |         ├─ 0: "term"
 * |     |         └─ 1: "extract"
 * |     ├─ score: 0.4444444444444444
 * |     └─ nodes: Array[2]
 * ├─ 3: Object
 * |     ├─ stems: Array[2]
 * |     |         ├─ 0: "knowledg"
 * |     |         └─ 1: "domain"
 * |     ├─ score: 0.20512820512820512
 * |     └─ nodes: Array[2]
 * └─ 5: Object
 *       ├─ stems: Array[1]
 *       |         └─ 0: "commun"
 *       ├─ score: 0.15384615384615385
 *       └─ nodes: Array[3]
*/
```

Options:

 * minimum: Return at least (when possible) `minimum` phrases.

Results: An array, containing match-objects:

 * stems: An array containing the stemms of all matched word nodes inside the phrase(s);
 * score: A value between 0 and (including) 1. the first match always has a score of 1;
 * nodes: An matrix containing array-phrases, each in turn containing word nodes.

## Benchmark

Run the benchmark yourself:

```sh
$ npm run benchmark
```

On a MacBook Air, `keywords()` runs about 3,041 op/s on a section / small article.

```
            Finding keywords in English
 3,041 op/s » small (10 paragraphs, 20 sentences, 300 words)
   349 op/s » medium (100 paragraphs, 200 sentences, 3000 words)

            Finding keyphrases in English
   738 op/s » small (10 paragraphs, 20 sentences, 300 words)
    47 op/s » medium (100 paragraphs, 200 sentences, 3000 words)
```

## License

  MIT
