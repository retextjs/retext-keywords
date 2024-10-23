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

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`unified().use(retextKeywords[, options])`](#unifieduseretextkeywords-options)
  * [`Keyphrase`](#keyphrase)
  * [`Keyword`](#keyword)
  * [`Options`](#options)
  * [`PhraseMatch`](#phrasematch)
  * [`WordMatch`](#wordmatch)
* [Types](#types)
* [Compatibility](#compatibility)
* [Contribute](#contribute)
* [License](#license)

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
In Node.js (version 16+), install with [npm][]:

```sh
npm install retext-keywords
```

In Deno with [`esm.sh`][esmsh]:

```js
import retextKeywords from 'https://esm.sh/retext-keywords@8'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import retextKeywords from 'https://esm.sh/retext-keywords@8?bundle'
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

…and our module `example.js` contains:

```js
import {toString} from 'nlcst-to-string'
import {retext} from 'retext'
import retextKeywords from 'retext-keywords'
import retextPos from 'retext-pos'
import {read} from 'to-vfile'

const file = await retext()
  .use(retextPos) // Make sure to use `retext-pos` before `retext-keywords`.
  .use(retextKeywords)
  .process(await read('example.txt'))

console.log('Keywords:')

if (file.data.keywords) {
  for (const keyword of file.data.keywords) {
    console.log(toString(keyword.matches[0].node))
  }
}

console.log()
console.log('Key-phrases:')

if (file.data.keyphrases) {
  for (const phrase of file.data.keyphrases) {
    console.log(toString(phrase.matches[0].nodes))
  }
}
```

…then running `node example.js` yields:

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
The default export is [`retextKeywords`][api-retext-keywords].

### `unified().use(retextKeywords[, options])`

Extract keywords and key phrases.

The results are stored on `file.data.keyphrases`
([`Array<Keyphrase>`][api-keyphrase]) and `file.data.keywords`
([`Array<Keyword>`][api-keyword]).

###### Parameters

* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Transform ([`Transformer`][unified-transformer]).

### `Keyphrase`

Info on a key phrase (TypeScript type).

###### Fields

* `matches` ([`Array<PhraseMatch>`][api-phrase-match])
  — all matches
* `score` (`number`)
  — score of phrase, for one match
* `stems` (`Array<string>`)
  — stems of phrase
* `weight` (`number`)
  — score of phrase, for all matches

### `Keyword`

Info on a keyword (TypeScript type).

###### Fields

* `matches` ([`Array<WordMatch>`][api-word-match])
  — all matches
* `score` (`number`)
  — score of word, for all matches
* `stem` (`string`)
  — stems of word

### `Options`

Configuration (TypeScript type).

###### Fields

* `maximum` (`number`, default: `5`)
  — try to detect at most `maximum` words and phrases; actual counts may
  differ, for example, when two words have the same score, both will be
  returned; when too few words exist, less will be returned

### `PhraseMatch`

Match (TypeScript type).

###### Fields

* `nodes` ([`Array<Node>`][nlcst-node])
  — matched nodes
* `parent` ([`Node`][nlcst-node])
  — parent

### `WordMatch`

Match (TypeScript type).

###### Fields

* `node` ([`Node`][nlcst-node])
  — matched node
* `index` (`number`)
  — index of `node` in `parent`
* `parent` ([`Node`][nlcst-node])
  — parent

## Types

This package is fully typed with [TypeScript][].
It exports the additional types
[`Keyphrase`][api-keyphrase],
[`Keyword`][api-keyword],
[`Options`][api-options],
[`PhraseMatch`][api-phrase-match], and
[`WordMatch`][api-word-match].

It also registers the `file.data` fields with `vfile`.
If you’re working with the file, make sure to import this plugin somewhere in
your types, as that registers the new fields on the file.

```js
/**
 * @import {} from 'retext-keywords'
 */

import {VFile} from 'vfile'

const file = new VFile()

console.log(file.data.keywords) //=> TS now knows this is `Array<Keyword> | undefined`.
```

## Compatibility

Projects maintained by the unified collective are compatible with maintained
versions of Node.js.

When we cut a new major release, we drop support for unmaintained versions of
Node.
This means we try to keep the current release line, `retext-keywords@^8`,
compatible with Node.js 16.

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

[size-badge]: https://img.shields.io/bundlejs/size/retext-keywords

[size]: https://bundlejs.com/?q=retext-keywords

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

[term-extraction]: https://en.wikipedia.org/wiki/Terminology_extraction

[nlcst-node]: https://github.com/syntax-tree/nlcst?tab=readme-ov-file#nodes

[retext]: https://github.com/retextjs/retext

[unified]: https://github.com/unifiedjs/unified

[unified-transformer]: https://github.com/unifiedjs/unified#transformer

[vfile]: https://github.com/vfile/vfile

[api-keyphrase]: #keyphrase

[api-keyword]: #keyword

[api-options]: #options

[api-phrase-match]: #phrasematch

[api-retext-keywords]: #unifieduseretextkeywords-options

[api-word-match]: #wordmatch
