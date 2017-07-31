# retext-keywords [![Build Status][travis-badge]][travis] [![Coverage Status][codecov-badge]][codecov]

Keyword extraction with [**retext**][retext].

## Installation

[npm][]:

```bash
npm install retext-keywords
```

## Usage

Say we have the following file, `example.txt`, with the first three paragraphs
on [Term Extraction][term-extraction] from Wikipedia:

```text
Terminology mining, term extraction, term recognition, or glossary extraction, is a subtask of information extraction. The goal of terminology extraction is to automatically extract relevant terms from a given corpus.

In the semantic web era, a growing number of communities and networked enterprises started to access and interoperate through the internet. Modeling these communities and their information needs is important for several web applications, like topic-driven web crawlers, web services, recommender systems, etc. The development of terminology extraction is essential to the language industry.

One of the first steps to model the knowledge domain of a virtual community is to collect a vocabulary of domain-relevant terms, constituting the linguistic surface manifestation of domain concepts. Several methods to automatically extract technical terms from domain-specific document warehouses have been described in the literature.

Typically, approaches to automatic term extraction make use of linguistic processors (part of speech tagging, phrase chunking) to extract terminological candidates, i.e. syntactically plausible terminological noun phrases, NPs (e.g. compounds "credit card", adjective-NPs "local tourist information office", and prepositional-NPs "board of directors" - in English, the first two constructs are the most frequent). Terminological entries are then filtered from the candidate list using statistical and machine learning methods. Once filtered, because of their low ambiguity and high specificity, these terms are particularly useful for conceptualizing a knowledge domain or for supporting the creation of a domain ontology. Furthermore, terminology extraction is a very useful starting point for semantic similarity, knowledge management, human translation and machine translation, etc.
```

And our script, `example.js`, looks as follows:

```javascript
var vfile = require('to-vfile');
var retext = require('retext');
var keywords = require('retext-keywords');
var nlcstToString = require('nlcst-to-string');

retext()
  .use(keywords)
  .process(vfile.readSync('example.txt'), function (err, file) {
    if (err) throw err;

    console.log('Keywords:');
    file.data.keywords.forEach(function (keyword) {
      console.log(nlcstToString(keyword.matches[0].node));
    });

    console.log();
    console.log('Key-phrases:');
    file.data.keyphrases.forEach(function (phrase) {
      console.log(phrase.matches[0].nodes.map(nlcstToString).join(''));
    });
  }
);
```

Now, running `node example` yields:

```text
Keywords:
term
extraction
Terminology
web
domain

Key-phrases:
terminology extraction
terms
term extraction
knowledge domain
communities
```

## API

### `retext().use(keywords[, options])`

Extract keywords and key-phrases from the document.

The results are stored on `file.data`: keywords at `file.data.keywords`
and key-phrases at `file.data.keyphrases`.  Both are lists.

A single keyword looks as follows:

```js
{
  stem: 'term',
  score: 1,
  matches: [
    {node: Node, index: 5, parent: Node},
    // ...
  ],
  // ...
}
```

...and a key-phrase:

```js
{
  score: 1,
  weight: 11,
  stems: ['terminolog', 'extract'],
  value: 'terminolog extract',
  matches:  [
    {nodes: [Node, Node, Node], parent: Node},
    // ...
  ]
}
```

###### `options`

*   `maximum` (default: `5`) — Try to detect `words` and `phrases`
    words;

    Note that actual counts may differ.  For example, when two words
    have the same score, both will be returned.  Or when too few words
    exist, less will be returned. the same goes for phrases.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[travis-badge]: https://img.shields.io/travis/wooorm/retext-keywords.svg

[travis]: https://travis-ci.org/wooorm/retext-keywords

[codecov-badge]: https://img.shields.io/codecov/c/github/wooorm/retext-keywords.svg

[codecov]: https://codecov.io/github/wooorm/retext-keywords

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[retext]: https://github.com/wooorm/retext

[term-extraction]: http://en.wikipedia.org/wiki/Terminology_extraction
