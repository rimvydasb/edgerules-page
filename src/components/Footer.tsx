import React from 'react'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__grid">
                    <div className="footer__col">
                        <div className="footer__title">GitHub</div>
                        <ul className="footer__list">
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    EdgeRules Core
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules-page"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    EdgeRules Page
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer__col">
                        <div className="footer__title">Markdown Reference</div>
                        <ul className="footer__list">
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules-page/blob/main/public/docs/BASE_EXAMPLES.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    BASE_EXAMPLES.md
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer__col">
                        <div className="footer__title">Project</div>
                        <ul className="footer__list">
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    License
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://www.linkedin.com/in/rimvydasb/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Contacts
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer__bottom">
                    <div>Interactive examples powered by EdgeRules WASM.</div>
                    <div className="footer__copyright">© {new Date().getFullYear()} edgerules-page</div>
                </div>
            </div>
        </footer>
    )
}

