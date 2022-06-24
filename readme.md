# retext-keywords

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

**[retext][]** plugin to extract keywords and key phrases.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`unified().use(retextKeywords[, options])`](#unifieduseretextkeywords-options)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a [unified][] ([retext][]) plugin to extract keywords and key
phrases from a document, and exposes that metadata on the [file][vfile].

## When should I use this?

You can use this plugin any time you’re dealing with unified or retext already,
and are interested in keywords and key phrases.
Importantly, keywords extraction in NLP is a rather heavy and sometimes fragile
process, so you might be better off manually providing a list of keywords.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, 16.0+, or 18.0+), install with [npm][]:

```sh
npm install retext-keywords
```

In Deno with [`esm.sh`][esmsh]:

```js
import retextKeywords from 'https://esm.sh/retext-keywords@7'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import retextKeywords from 'https://esm.sh/retext-keywords@7?bundle'
</script>
```

## Use

Say our document `example.txt` contains (from [Wikipedia][term-extraction]):

```txt
Terminology mining, term extraction, term recognition, or glossary extraction, is a subtask of information extraction. The goal of terminology extraction is to automatically extract relevant terms from a given corpus.

In the semantic web era, a growing number of communities and networked enterprises started to access and interoperate through the internet. Modeling these communities and their information needs is important for several web applications, like topic-driven web crawlers, web services, recommender systems, etc. The development of terminology extraction is essential to the language industry.

One of the first steps to model the knowledge domain of a virtual community is to collect a vocabulary of domain-relevant terms, constituting the linguistic surface manifestation of domain concepts. Several methods to automatically extract technical terms from domain-specific document warehouses have been described in the literature.

Typically, approaches to automatic term extraction make use of linguistic processors (part of speech tagging, phrase chunking) to extract terminological candidates, i.e. syntactically plausible terminological noun phrases, NPs (e.g. compounds "credit card", adjective-NPs "local tourist information office", and prepositional-NPs "board of directors" - in English, the first two constructs are the most frequent). Terminological entries are then filtered from the candidate list using statistical and machine learning methods. Once filtered, because of their low ambiguity and high specificity, these terms are particularly useful for conceptualizing a knowledge domain or for supporting the creation of a domain ontology. Furthermore, terminology extraction is a very useful starting point for semantic similarity, knowledge management, human translation and machine translation, etc.
```

…and our module `example.js` looks as follows:

```js
import {read} from 'to-vfile'
import {toString} from 'nlcst-to-string'
import {retext} from 'retext'
import retextPos from 'retext-pos'
import retextKeywords from 'retext-keywords'

const file = retext()
  .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
  .use(retextKeywords)
  .process(await read('example.txt'))

console.log('Keywords:')
file.data.keywords.forEach((keyword) => {
  console.log(toString(keyword.matches[0].node))
})

console.log()
console.log('Key-phrases:')
file.data.keyphrases.forEach((phrase) => {
  console.log(phrase.matches[0].nodes.map((d) => toString(d)).join(''))
})
```

…now running `node example.js` yields:

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

This package exports no identifiers.
The default export is `retextKeywords`.

### `unified().use(retextKeywords[, options])`

Extract keywords and key phrases.

The results are stored on `file.data.{keywords,keyphrases}`.
Both are lists.

A single keyword looks as follows:

```js
{
  stem: 'term',
  score: 1,
  matches: [
    {node: Node, index: 5, parent: Node},
    // …
  ],
  // …
}
```

…and a key phrase:

```js
{
  score: 1,
  weight: 11,
  stems: ['terminolog', 'extract'],
  value: 'terminolog extract',
  matches:  [
    {nodes: [Node, Node, Node], parent: Node},
    // …
  ]
}
```

##### `options`

Configuration (optional).

###### `options.maximum`

Try to detect at most `maximum` `words` and `phrases` (`number`, default: `5`).

Note that actual counts may differ.
For example, when two words have the same score, both will be returned.
Or when too few words exist, less will be returned.
The same goes for phrases.

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `Options`, `Keyphrase`, `PhraseMatch`,
`Keyword`, `KeywordMatch`.

It also registers the `file.data` fields with `vfile`.
If you’re working with the file, make sure to import this plugin somewhere in
your types, as that registers the new fields on the file.

```js
/**
 * @typedef {import('retext-keywords')}
 */

import {VFile} from 'vfile'

const file = new VFile()

console.log(file.data.keywords) //=> TS now knows the type of this.
```

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, 16.0+, and 18.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Contribute

See [`contributing.md`][contributing] in [`retextjs/.github`][health] for ways
to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/retextjs/retext-keywords/workflows/main/badge.svg

[build]: https://github.com/retextjs/retext-keywords/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/retextjs/retext-keywords.svg

[coverage]: https://codecov.io/github/retextjs/retext-keywords

[downloads-badge]: https://img.shields.io/npm/dm/retext-keywords.svg

[downloads]: https://www.npmjs.com/package/retext-keywords

[size-badge]: https://img.shields.io/bundlephobia/minzip/retext-keywords.svg

[size]: https://bundlephobia.com/result?p=retext-keywords

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/retextjs/retext/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[health]: https://github.com/retextjs/.github

[contributing]: https://github.com/retextjs/.github/blob/main/contributing.md

[support]: https://github.com/retextjs/.github/blob/main/support.md

[coc]: https://github.com/retextjs/.github/blob/main/code-of-conduct.md

[license]: license

[author]: https://wooorm.com

[unified]: https://github.com/unifiedjs/unified

[retext]: https://github.com/retextjs/retext

[term-extraction]: https://en.wikipedia.org/wiki/Terminology_extraction

[vfile]: https://github.com/vfile/vfile
