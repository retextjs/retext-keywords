# retext-keywords

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**retext**][retext] plugin to extract keywords and key-phrases.

## Install

[npm][]:

```sh
npm install retext-keywords
```

## Use

Say we have the following file, `example.txt`, with the first four paragraphs
on [Term Extraction][term-extraction] from Wikipedia:

```txt
Terminology mining, term extraction, term recognition, or glossary extraction, is a subtask of information extraction. The goal of terminology extraction is to automatically extract relevant terms from a given corpus.

In the semantic web era, a growing number of communities and networked enterprises started to access and interoperate through the internet. Modeling these communities and their information needs is important for several web applications, like topic-driven web crawlers, web services, recommender systems, etc. The development of terminology extraction is essential to the language industry.

One of the first steps to model the knowledge domain of a virtual community is to collect a vocabulary of domain-relevant terms, constituting the linguistic surface manifestation of domain concepts. Several methods to automatically extract technical terms from domain-specific document warehouses have been described in the literature.

Typically, approaches to automatic term extraction make use of linguistic processors (part of speech tagging, phrase chunking) to extract terminological candidates, i.e. syntactically plausible terminological noun phrases, NPs (e.g. compounds "credit card", adjective-NPs "local tourist information office", and prepositional-NPs "board of directors" - in English, the first two constructs are the most frequent). Terminological entries are then filtered from the candidate list using statistical and machine learning methods. Once filtered, because of their low ambiguity and high specificity, these terms are particularly useful for conceptualizing a knowledge domain or for supporting the creation of a domain ontology. Furthermore, terminology extraction is a very useful starting point for semantic similarity, knowledge management, human translation and machine translation, etc.
```

…and our script, `example.js`, looks as follows:

```js
var vfile = require('to-vfile')
var retext = require('retext')
var keywords = require('retext-keywords')
var toString = require('nlcst-to-string')

retext()
  .use(keywords)
  .process(vfile.readSync('example.txt'), done)

function done(err, file) {
  if (err) throw err

  console.log('Keywords:')
  file.data.keywords.forEach(function(keyword) {
    console.log(toString(keyword.matches[0].node))
  })

  console.log()
  console.log('Key-phrases:')
  file.data.keyphrases.forEach(function(phrase) {
    console.log(phrase.matches[0].nodes.map(stringify).join(''))
    function stringify(value) {
      return toString(value)
    }
  })
}
```

Now, running `node example` yields:

```txt
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

The results are stored on `file.data`: keywords at `file.data.keywords` and
key-phrases at `file.data.keyphrases`.
Both are lists.

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

…and a key-phrase:

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

###### `options.maximum`

Try to detect at most `maximum` `words` and `phrases` (`number`, default: `5`).

Note that actual counts may differ.
For example, when two words have the same score, both will be returned.
Or when too few words exist, less will be returned. the same goes for phrases.

## Contribute

See [`contributing.md`][contributing] in [`retextjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/retextjs/retext-keywords.svg

[build]: https://travis-ci.org/retextjs/retext-keywords

[coverage-badge]: https://img.shields.io/codecov/c/github/retextjs/retext-keywords.svg

[coverage]: https://codecov.io/github/retextjs/retext-keywords

[downloads-badge]: https://img.shields.io/npm/dm/retext-keywords.svg

[downloads]: https://www.npmjs.com/package/retext-keywords

[size-badge]: https://img.shields.io/bundlephobia/minzip/retext-keywords.svg

[size]: https://bundlephobia.com/result?p=retext-keywords

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/retext

[npm]: https://docs.npmjs.com/cli/install

[health]: https://github.com/retextjs/.github

[contributing]: https://github.com/retextjs/.github/blob/master/contributing.md

[support]: https://github.com/retextjs/.github/blob/master/support.md

[coc]: https://github.com/retextjs/.github/blob/master/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[retext]: https://github.com/retextjs/retext

[term-extraction]: https://en.wikipedia.org/wiki/Terminology_extraction
