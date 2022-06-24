import assert from 'node:assert'
import test from 'tape'
import {retext} from 'retext'
import retextPos from 'retext-pos'
import retextKeywords from './index.js'

// Fixture: First three paragraphs on Term Extraction from Wikipedia:
// https://en.wikipedia.org/wiki/Terminology_extraction.
//
// There’s also some `constructor`s sprinkled throughout the document to check
// if prototypal properties work correctly.
const fixture =
  'Terminology mining, term extraction, term recognition, or ' +
  'glossary extraction, is a subtask of information extraction. ' +
  'The goal of terminology extraction is to automatically extract ' +
  'relevant terms from a given corpus constructor.' +
  '\n\n' +
  'In the semantic web era, a growing number of communities and ' +
  'networked enterprises started to access and interoperate through ' +
  'the internet. Modeling these communities and their information ' +
  'needs is important for several web applications, like ' +
  'topic-driven web crawlers, web services, recommender systems, ' +
  'etc. The development of terminology extraction is essential to ' +
  'the language industry constructor.' +
  '\n\n' +
  'One of the first steps to model the knowledge domain of a ' +
  'virtual community is to collect a vocabulary of domain-relevant ' +
  'terms, constituting the linguistic surface manifestation of ' +
  'domain concepts. Several methods to automatically extract ' +
  'technical terms from domain-specific document warehouses have ' +
  'been described in the literature constructor.' +
  '\n\n' +
  'Typically, approaches to automatic term extraction make use of ' +
  'linguistic processors (part of speech tagging, phrase chunking) ' +
  'to extract terminological candidates, i.e. syntactically ' +
  'plausible terminological noun phrases, NPs (e.g. compounds ' +
  '"credit card", adjective-NPs "local tourist information office", ' +
  'and prepositional-NPs "board of directors" - in English, the ' +
  'first two constructs are the most frequent). Terminological ' +
  'entries are then filtered from the candidate list using ' +
  'statistical and machine learning methods constructor. Once filtered, ' +
  'because of their low ambiguity and high specificity, these terms ' +
  'are particularly useful for conceptualizing a knowledge domain ' +
  'or for supporting the creation of a domain ontology. Furthermore, ' +
  'terminology extraction is a very useful starting point for ' +
  'semantic similarity, knowledge management, human translation ' +
  'and machine translation, etc. constructor.'

test('retext-keywords', (t) => {
  t.plan(15)

  retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(fixture)
    .then((file) => {
      t.ok(Array.isArray(file.data.keywords), 'keywords')
      t.ok(Array.isArray(file.data.keyphrases), 'keywords')
      assert(file.data.keywords, 'ts')
      assert(file.data.keyphrases, 'ts')

      t.deepEqual(
        file.data.keywords.map((d) => Math.round(d.score * 1e2) / 1e2),
        [1, 1, 0.71, 0.71, 0.57, 0.57],
        'keywords[n].score'
      )
      t.ok(
        file.data.keywords.every((d) => 'stem' in d),
        'keywords[n].stem'
      )
      t.ok(
        file.data.keywords.every((d) => 'matches' in d),
        'keywords[n].matches'
      )
      t.ok(
        file.data.keywords.every((d) => d.matches.every((d) => 'node' in d)),
        'keywords[n].matches[n].node'
      )
      t.ok(
        file.data.keywords.every((d) => d.matches.every((d) => 'parent' in d)),
        'keywords[n].matches[n].parent'
      )
      t.ok(
        file.data.keywords.every((d) => d.matches.every((d) => 'index' in d)),
        'keywords[n].matches[n].index'
      )

      t.deepEqual(
        file.data.keyphrases.map((d) => Math.round(d.score * 1e2) / 1e2),
        [1, 0.55, 0.53, 0.24, 0.18],
        'keyphrases[n].score'
      )
      t.ok(
        file.data.keyphrases.every((d) => 'weight' in d),
        'keyphrases[n].weight'
      )
      t.ok(
        file.data.keyphrases.every((d) => 'value' in d),
        'keyphrases[n].value'
      )
      t.ok(
        file.data.keyphrases.every((d) => 'stems' in d),
        'keyphrases[n].stems'
      )
      t.ok(
        file.data.keyphrases.every((d) => 'matches' in d),
        'keyphrases[n].matches'
      )
      t.ok(
        file.data.keyphrases.every((d) => d.matches.every((d) => 'nodes' in d)),
        'keyphrases[n].matches[n].nodes'
      )
      t.ok(
        file.data.keyphrases.every((d) =>
          d.matches.every((d) => 'parent' in d)
        ),
        'keyphrases[n].matches[n].parent'
      )
    }, t.ifErr)
})
