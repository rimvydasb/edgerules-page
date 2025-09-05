import React, { useState, useMemo } from 'react'
import Editor from 'react-simple-code-editor'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
// Using custom bright theme styles in src/styles.css

const initialCode = `// Welcome to EdgeRules Playground
// Edit the JavaScript below. Syntax highlighting is powered by Prism.

function greet(name) {
  return ` + "`Hello, ${name}!`" + `
}

console.log(greet('world'))
`;

export default function App() {
  const [code, setCode] = useState(initialCode)
  const [lang] = useState('javascript')

  const highlight = useMemo(() => (codeStr) => {
    try {
      return Prism.highlight(codeStr, Prism.languages[lang], lang)
    } catch (e) {
      return codeStr
    }
  }, [lang])

  return (
    <div className="page bright">
      <header className="header bright">
        <h1>EdgeRules Playground</h1>
        <p>Minimal Vite + React page using react-simple-code-editor</p>
      </header>

      <div className="container">
        <div className="container__content">
          <div className="container_editor_area">
            <Editor
              value={code}
              onValueChange={setCode}
              highlight={highlight}
              padding={16}
              textareaId="code-editor"
              className="container__editor editor"
              preClassName={`language-${lang}`}
              style={{
                fontFamily: '"Fira Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
              }}
            />
          </div>

          <section className="output-wrap bright">
            <h2>Output (static preview)</h2>
            <pre className="output bright">
{code}
            </pre>
          </section>
        </div>
      </div>

      <footer className="footer bright">
        <span>Ready for EdgeRules examples next.</span>
      </footer>
    </div>
  )
}
