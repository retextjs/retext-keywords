var doc = require('global/document')
var win = require('global/window')
var createElement = require('virtual-dom/create-element')
var diff = require('virtual-dom/diff')
var patch = require('virtual-dom/patch')
var h = require('virtual-dom/h')
var debounce = require('debounce')
var vfile = require('vfile')
var unified = require('unified')
var english = require('retext-english')
var pos = require('retext-pos')
var keywords = require('retext-keywords')

var darkQuery = '(prefers-color-scheme: dark)'

var ceil = Math.ceil

var processor = unified()
  .use(english)
  .use(pos)
  .use(keywords)
  .use(add)

var main = doc.querySelector('main')

var state = {
  value: doc.querySelector('template').innerHTML
}

win.matchMedia(darkQuery).addListener(onmediachange)

var tree = render(state)
var dom = main.appendChild(createElement(tree))

function onchangevalue(ev) {
  var prev = state.value
  var next = ev.target.value

  if (prev !== next) {
    state.value = next
    onchange()
  }
}

function onchange() {
  var next = render(state)
  dom = patch(dom, diff(tree, next))
  tree = next
}

function render(state) {
  var file = vfile(state.value)
  var tree = processor.runSync(processor.parse(file), file)
  var change = debounce(onchangevalue, 4)
  var key = 0

  setTimeout(resize, 4)

  return h('div', [
    h('section.highlight', [h('h1', {key: 'title'}, 'Keywords')]),
    h('div', {key: 'editor', className: 'editor'}, [
      h('div', {key: 'draw', className: 'draw'}, pad(all(tree, []))),
      h('textarea', {
        key: 'area',
        value: state.value,
        oninput: change,
        onpaste: change,
        onkeyup: change,
        onmouseup: change
      })
    ]),
    h('section.credits', {key: 'credits'}, [
      h('p', [
        h(
          'a',
          {href: 'https://github.com/retextjs/retext-keywords'},
          'Project'
        ),
        ' • ',
        h(
          'a',
          {href: 'https://github.com/retextjs/retext-keywords/tree/website'},
          'Fork this website'
        ),
        ' • ',
        h(
          'a',
          {
            href:
              'https://github.com/retextjs/retext-keywords/blob/master/license'
          },
          'MIT'
        ),
        ' • ',
        h('a', {href: 'https://wooorm.com'}, '@wooorm')
      ])
    ])
  ])

  function all(node, parentIds) {
    var children = node.children
    var length = children.length
    var index = -1
    var results = []

    while (++index < length) {
      results = results.concat(one(children[index], parentIds.concat(index)))
    }

    return results
  }

  function one(node, parentIds) {
    var result = 'value' in node ? node.value : all(node, parentIds)
    var id = parentIds.join('-') + '-' + key
    var score = node.data && node.data.score

    if (score !== undefined) {
      result = h(
        'span',
        {key: id, style: {backgroundColor: color(score)}},
        result
      )
      key++
    }

    return result
  }

  // Trailing white-space in a `textarea` is shown, but not in a `div` with
  // `white-space: pre-wrap`.
  // Add a `br` to make the last line feed explicit.
  function pad(nodes) {
    var tail = nodes[nodes.length - 1]

    if (typeof tail === 'string' && tail.charAt(tail.length - 1) === '\n') {
      nodes.push(h('br', {key: 'break'}))
    }

    return nodes
  }
}

function rows(node) {
  if (node) {
    return (
      ceil(
        node.getBoundingClientRect().height /
          parseInt(win.getComputedStyle(node).lineHeight, 10)
      ) + 1
    )
  }
}

function resize() {
  dom.querySelector('textarea').rows = rows(dom.querySelector('.draw'))
}

function color(value) {
  return 'hsla(133, 62%, 51%, ' + (value / 2).toFixed(2) + ')'
}

function onmediachange() {
  onchange()
}

function add() {
  this.use(adder)

  function adder() {
    return transformer
  }

  function transformer(tree, file) {
    file.data.keywords.forEach(function(keyword) {
      keyword.matches.forEach(function(match) {
        match.node.data.score = keyword.score
      })
    })
  }
}
