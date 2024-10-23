/* eslint-env browser */
/// <reference lib="dom" />

/**
 * @import {Nodes, Parents, Root} from 'nlcst'
 */

import ReactDom from 'react-dom/client'
import React from 'react'
import retextEnglish from 'retext-english'
import retextKeywords from 'retext-keywords'
import retextPos from 'retext-pos'
import {unified} from 'unified'
import {VFile} from 'vfile'

const $main = /** @type {HTMLElement} */ (document.querySelector('main'))
const $template = /** @type {HTMLTemplateElement} */ (
  document.querySelector('template')
)

const processor = unified()
  .use(retextEnglish)
  .use(retextPos)
  .use(retextKeywords)

const root = ReactDom.createRoot($main)

root.render(React.createElement(Playground))

function Playground() {
  const [text, setText] = React.useState($template.innerHTML)
  const file = new VFile(text)

  const tree = /** @type {Root} */ (
    processor.runSync(processor.parse(file), file)
  )

  if (file.data.keywords) {
    for (const keyword of file.data.keywords) {
      for (const match of keyword.matches) {
        const data = match.node.data || (match.node.data = {})
        data.score = keyword.score
      }
    }
  }

  return (
    <div>
      <section className="highlight">
        <h1>
          <code>retext-keywords</code>
        </h1>
      </section>
      <div className="editor">
        <div className="draw">
          {all(tree)}
          {/* Trailing whitespace in a `textarea` is shown,
          but not in a `div` with `white-space: pre-wrap`;
          add a `br` to make the last newline explicit. */}
          {/\n[ \t]*$/.test(text) ? <br /> : undefined}
        </div>
        <textarea
          className="write"
          onChange={(event) => setText(event.target.value)}
          rows={text.split('\n').length + 1}
          spellCheck="false"
          value={text}
        />
      </div>
      <section className="credits">
        <p>
          <a href="https://github.com/retextjs/retext-keywords">
            <code>retext-keywords</code>
          </a>{' '}
          •{' '}
          <a href="https://github.com/retextjs/retext-keywords/tree/website">
            Fork this website
          </a>{' '}
          •{' '}
          <a href="https://github.com/retextjs/retext-keywords/blob/main/license">
            MIT
          </a>{' '}
          • <a href="https://github.com/wooorm">@wooorm</a>
        </p>
      </section>
    </div>
  )
}

/**
 * @param {Parents} parent
 * @returns {Array<JSX.Element | string>}
 */
function all(parent) {
  /** @type {Array<JSX.Element | string>} */
  const results = []

  for (const child of parent.children) {
    const result = one(child)
    if (Array.isArray(result)) {
      results.push(...result)
    } else {
      results.push(result)
    }
  }

  return results
}

/**
 * @param {Nodes} node
 * @returns {Array<JSX.Element | string> | JSX.Element | string}
 */
function one(node) {
  const result = 'value' in node ? node.value : all(node)
  const score = node.type === 'WordNode' ? node.data?.score : undefined

  if (score === undefined) return result

  const backgroundColor = 'hsla(133, 62%, 51%, ' + (score / 2).toFixed(2) + ')'

  return <span style={{backgroundColor}}>{result}</span>
}
