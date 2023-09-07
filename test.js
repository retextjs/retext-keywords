import assert from 'node:assert/strict'
import test from 'node:test'
import {retext} from 'retext'
import retextKeywords from 'retext-keywords'
import retextPos from 'retext-pos'

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

test('retext-keywords', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(Object.keys(await import('retext-keywords')).sort(), [
      'default'
    ])
  })

  const file = await retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(fixture)

  await t.test('should expose `keywords` as an array', async function () {
    assert.ok(Array.isArray(file.data.keywords))
  })

  await t.test('should expose a keyword', async function () {
    assert(file.data.keywords)
    assert.deepEqual(
      {...file.data.keywords[0], matches: []},
      {matches: [], score: 1, stem: 'term'}
    )
  })

  await t.test('should expose `matches` on keywords', async function () {
    assert(file.data.keywords)
    const keyword = file.data.keywords[0]
    const match = keyword.matches[0]
    assert.deepEqual(
      {...match, parent: undefined},
      {
        node: {
          type: 'WordNode',
          children: [
            {
              type: 'TextNode',
              value: 'term',
              position: {
                start: {line: 1, column: 21, offset: 20},
                end: {line: 1, column: 25, offset: 24}
              }
            }
          ],
          position: {
            start: {line: 1, column: 21, offset: 20},
            end: {line: 1, column: 25, offset: 24}
          },
          data: {partOfSpeech: 'NN'}
        },
        index: 5,
        parent: undefined
      }
    )
  })

  await t.test('should expose `keyphrases` as an array', async function () {
    assert.ok(Array.isArray(file.data.keyphrases))
  })

  await t.test('should expose a keyphrase', async function () {
    assert(file.data.keyphrases)
    assert.deepEqual(
      {...file.data.keyphrases[0], matches: []},
      {
        matches: [],
        score: 1,
        stems: ['terminolog', 'extract'],
        weight: 11
      }
    )
  })

  await t.test('should expose `matches` on keyphrases', async function () {
    assert(file.data.keyphrases)
    const keyphrase = file.data.keyphrases[0]
    const match = keyphrase.matches[0]
    assert.deepEqual(
      {...match, parent: undefined},
      {
        nodes: [
          {
            type: 'WordNode',
            children: [
              {
                type: 'TextNode',
                value: 'terminology',
                position: {
                  start: {line: 1, column: 132, offset: 131},
                  end: {line: 1, column: 143, offset: 142}
                }
              }
            ],
            position: {
              start: {line: 1, column: 132, offset: 131},
              end: {line: 1, column: 143, offset: 142}
            },
            data: {partOfSpeech: 'NN'}
          },
          {
            type: 'WhiteSpaceNode',
            value: ' ',
            position: {
              start: {line: 1, column: 143, offset: 142},
              end: {line: 1, column: 144, offset: 143}
            }
          },
          {
            type: 'WordNode',
            children: [
              {
                type: 'TextNode',
                value: 'extraction',
                position: {
                  start: {line: 1, column: 144, offset: 143},
                  end: {line: 1, column: 154, offset: 153}
                }
              }
            ],
            position: {
              start: {line: 1, column: 144, offset: 143},
              end: {line: 1, column: 154, offset: 153}
            },
            data: {partOfSpeech: 'NN'}
          }
        ],
        parent: undefined
      }
    )
  })
})
