import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ArrowUpRight } from 'lucide-react'
import './Navbar.css'

const navLinks = [
    { label: 'Home', path: '/landingpage' },
    { label: 'Platform', path: '/landingpage/features' },
    { label: 'For Brands', path: '/landingpage/for-brands' },
    { label: 'For Creators', path: '/landingpage/for-creators' },
    { label: 'About', path: '/landingpage/about' },
    { label: 'Contact', path: '/landingpage/contact' },
]

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => { setMobileOpen(false) }, [location])

    return (
        <>
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}
            >
                <div className="navbar__container">
                    <Link to="/" className="navbar__logo">
                        <img src="/Yovoai-logo.jpg" alt="YovoAI Logo" className="navbar__logo-img" />
                        <span className="navbar__logo-text">Yovo<span className="navbar__logo-accent">AI</span></span>
                    </Link>

                    <nav className="navbar__desktop-nav">
                        {navLinks.map((link) => (
                            <Link key={link.path} to={link.path} className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}>
                                <span className="navbar__link-text">{link.label}</span>
                                {location.pathname === link.path && (
                                    <motion.div layoutId="nav-indicator" className="navbar__link-indicator" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="navbar__actions">
                        <a href="/admin/login" target="_blank" rel="noreferrer" className="navbar__btn">
                            <span className="navbar__btn-text">Dashboard</span>
                            <span className="navbar__btn-icon"><ArrowUpRight size={16} /></span>
                            <div className="navbar__btn-glow"></div>
                        </a>
                        <button className="navbar__menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </motion.header>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div className="navbar__mobile-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                        <div className="navbar__mobile-bg" onClick={() => setMobileOpen(false)}></div>
                        <motion.div className="navbar__mobile-menu" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                            <div className="navbar__mobile-header">
                                <span className="navbar__logo-text" style={{ fontSize: '1.5rem' }}>Yovo<span className="navbar__logo-accent">AI</span></span>
                                <button className="navbar__mobile-close" onClick={() => setMobileOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="navbar__mobile-links">
                                {navLinks.map((link, i) => (
                                    <motion.div key={link.path} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}>
                                        <Link to={link.path} className={`navbar__mobile-link ${location.pathname === link.path ? 'navbar__mobile-link--active' : ''}`}>{link.label}</Link>
                                    </motion.div>
                                ))}
                            </div>
                            <motion.div className="navbar__mobile-footer" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
                                <a href="/admin/login" target="_blank" rel="noreferrer" className="navbar__mobile-btn">Dashboard <ArrowUpRight size={18} /></a>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
