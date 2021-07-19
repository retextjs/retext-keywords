import test from 'tape'
import {retext} from 'retext'
import retextPos from 'retext-pos'
import retextKeywords from './index.js'

// Fixture: First three paragraphs on Term Extraction from Wikipedia:
// https://en.wikipedia.org/wiki/Terminology_extraction.
//
// There’s also some `constructor`s sprinkled throughout the document to check
// if prototypal properties work correctly.
var fixture =
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

var keyScores = [1, 1, 0.71, 0.71, 0.57, 0.57]
var phraseScores = [1, 0.55, 0.53, 0.24, 0.18]

test('retext-keywords', function (t) {
  retext()
    .use(retextPos)
    .use(retextKeywords)
    .process(fixture, function (error, file) {
      t.ifErr(error, 'should not fail')

      t.test('should work', function (st) {
        st.ok('keywords' in file.data)
        st.assert('keyphrases' in file.data)

        st.equal(file.data.keywords.length, 6)
        st.equal(file.data.keyphrases.length, 5)

        st.end()
      })

      t.test('should have scores', function (st) {
        file.data.keywords.forEach(function (keyword, n) {
          st.equal(Math.round(keyword.score * 1e2) / 1e2, keyScores[n])
        })

        file.data.keyphrases.forEach(function (phrase, n) {
          st.equal(Math.round(phrase.score * 1e2) / 1e2, phraseScores[n])
        })

        st.end()
      })

      t.test('should have stems', function (st) {
        file.data.keywords.forEach(function (keyword) {
          st.ok('stem' in keyword)
        })

        file.data.keyphrases.forEach(function (phrase) {
          st.ok('stems' in phrase)
        })

        st.end()
      })

      t.test('should have matches', function (st) {
        file.data.keywords.forEach(function (keyword) {
          st.ok('matches' in keyword)
        })

        file.data.keyphrases.forEach(function (phrase) {
          st.ok('matches' in phrase)
        })

        st.end()
      })

      t.test('keywords[n].matches[n]', function (st) {
        file.data.keywords.forEach(function (keyword) {
          keyword.matches.forEach(function (match) {
            st.assert('node' in match)
            st.assert('parent' in match)
            st.assert('index' in match)
          })
        })

        st.end()
      })

      t.test('keyphrases', function (st) {
        st.test('should have a weight', function (sst) {
          file.data.keyphrases.forEach(function (phrase) {
            sst.ok('weight' in phrase)
          })

          sst.end()
        })

        st.test('should have a value', function (sst) {
          file.data.keyphrases.forEach(function (phrase) {
            sst.ok('value' in phrase)
          })

          sst.end()
        })

        st.end()
      })

      t.test('keyphrases[n].matches[n]', function (st) {
        file.data.keyphrases.forEach(function (phrase) {
          phrase.matches.forEach(function (match) {
            st.ok('nodes' in match)
            st.ok('parent' in match)
          })
        })

        st.end()
      })

      t.end()
    })
})
