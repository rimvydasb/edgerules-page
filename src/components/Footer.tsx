import React from 'react'

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer__inner">
                <div className="footer__grid">
                    <div className="footer__col">
                        <div className="footer__title">About</div>
                        <ul className="footer__list">
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://rimvydasb.github.io/edgerules-page/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub Pages
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules-page/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Support & feedback
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="footer__col">
                        <div className="footer__title">Community</div>
                        <ul className="footer__list">
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub Profile
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules-page"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Repository
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
                                    href="https://github.com/rimvydasb/edgerules-page/blob/main/README.md"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    README
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer__link"
                                    href="https://github.com/rimvydasb/edgerules-page/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    License
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

