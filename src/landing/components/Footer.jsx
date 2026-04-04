import React, { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Instagram, Twitter, Linkedin, Youtube, ArrowUpRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import './Footer.css'

export default function Footer() {
    const location = useLocation()
    const isHomePage = location.pathname === '/landingpage'
    const constraintsRef = useRef(null)

    return (
        <footer className="footer bg-grid-footer">
            <div className="footer__glow-bg"></div>
            <div className="container relative">

                {/* ═ LARGE CTA (Only visible on Home page) ═ */}
                {isHomePage && (
                    <div className="footer-cta">
                        <div className="footer-cta__card">
                            <div className="footer-cta__glow"></div>
                            <div className="footer-cta__content">
                                {/* Premium Luxury Social + Brand Marquee */}
                                <section className="lux-marquee">
                                    <div className="lux-marquee__left" ref={constraintsRef}>
                                        <div className="lux-marquee__wave lux-marquee__wave--back"></div>
                                        <div className="lux-marquee__wave lux-marquee__wave--mid"></div>
                                        <div className="lux-marquee__wave lux-marquee__wave--front"></div>
                                        <div className="lux-marquee__halo"></div>
                                        <motion.div 
                                            className="lux-marquee__orb-wrapper lux-marquee__orb-wrapper--one"
                                            animate={{ y: [0, -15, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <motion.div 
                                                className="lux-marquee__glass-orb lux-marquee__glass-orb--one"
                                                drag
                                                dragConstraints={constraintsRef}
                                                whileHover={{ scale: 1.15, cursor: "grab", filter: "brightness(1.5)", boxShadow: "0 0 50px rgba(251, 191, 36, 0.8)", rotate: 15 }}
                                                whileDrag={{ scale: 0.95, cursor: "grabbing", filter: "brightness(1.8)", boxShadow: "0 0 60px rgba(234, 92, 10, 0.9)", rotate: 5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            />
                                        </motion.div>
                                        <motion.div 
                                            className="lux-marquee__orb-wrapper lux-marquee__orb-wrapper--two"
                                            animate={{ y: [0, -12, 0] }}
                                            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                        >
                                            <motion.div 
                                                className="lux-marquee__glass-orb lux-marquee__glass-orb--two"
                                                drag
                                                dragConstraints={constraintsRef}
                                                whileHover={{ scale: 1.15, cursor: "grab", filter: "brightness(1.5)", boxShadow: "0 0 50px rgba(234, 92, 10, 0.8)", rotate: -15 }}
                                                whileDrag={{ scale: 0.95, cursor: "grabbing", filter: "brightness(1.8)", boxShadow: "0 0 60px rgba(251, 191, 36, 0.9)", rotate: -5 }}
                                                transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                            />
                                        </motion.div>
                                    </div>

                                    <div className="lux-marquee__right">
                                        <div className="lux-marquee__label">
                                            <span className="lux-marquee__pill">SOCIAL REACH</span>
                                            <span className="lux-marquee__dot"></span>
                                            <span className="lux-marquee__pill lux-marquee__pill--soft">TRUSTED BY BRANDS</span>
                                        </div>

                                        {/* Top marquee: Social platforms */}
                                        <div className="lux-marquee__row lux-marquee__row--top">
                                            <div className="lux-marquee__track">
                                                <div className="lux-marquee__inner">
                                                    {/* First set */}
                                                    <div className="lux-marquee__item" aria-label="Instagram">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="YouTube">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Facebook">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="X (Twitter)">
                                                        <img src="https://cdn.brandfetch.io/x.com/w/400/h/400" alt="X (Twitter)" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="LinkedIn">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Snapchat">
                                                        <img src="https://cdn.brandfetch.io/snapchat.com/w/400/h/400" alt="Snapchat" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Pinterest">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png" alt="Pinterest" />
                                                    </div>

                                                    {/* Duplicated set for seamless loop */}
                                                    <div className="lux-marquee__item" aria-label="Instagram">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="YouTube">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg" alt="YouTube" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="TikTok">
                                                        <img src="https://cdn.brandfetch.io/tiktok.com/w/400/h/400" alt="TikTok" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Facebook">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" alt="Facebook" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="X (Twitter)">
                                                        <img src="https://cdn.brandfetch.io/x.com/w/400/h/400" alt="X (Twitter)" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="LinkedIn">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" alt="LinkedIn" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Snapchat">
                                                        <img src="https://cdn.brandfetch.io/snapchat.com/w/400/h/400" alt="Snapchat" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Pinterest">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Pinterest-logo.png" alt="Pinterest" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom marquee: Brand logos */}
                                        <div className="lux-marquee__row lux-marquee__row--bottom">
                                            <div className="lux-marquee__track lux-marquee__track--reverse">
                                                <div className="lux-marquee__inner">
                                                    {/* First set */}
                                                    <div className="lux-marquee__item" aria-label="Nike">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="Nike" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Nykaa">
                                                        <img src="https://cdn.brandfetch.io/nykaa.com/w/400/h/400" alt="Nykaa" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Mamaearth">
                                                        <img src="https://cdn.brandfetch.io/mamaearth.in/w/400/h/400" alt="Mamaearth" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Adidas">
                                                        <img src="https://cdn.brandfetch.io/adidas.com/w/400/h/400" alt="Adidas" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Amazon">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Flipkart">
                                                        <img src="https://cdn.brandfetch.io/flipkart.com/w/400/h/400" alt="Flipkart" style={{ height: '24px', objectFit: 'contain' }} />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="boAt">
                                                        <img src="https://cdn.brandfetch.io/boat-lifestyle.com/w/400/h/400" alt="boAt" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Coca-Cola">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg" alt="Coca-Cola" />
                                                    </div>

                                                    {/* Duplicated set for seamless loop */}
                                                    <div className="lux-marquee__item" aria-label="Nike">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg" alt="Nike" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Nykaa">
                                                        <img src="https://cdn.brandfetch.io/nykaa.com/w/400/h/400" alt="Nykaa" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Mamaearth">
                                                        <img src="https://cdn.brandfetch.io/mamaearth.in/w/400/h/400" alt="Mamaearth" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Adidas">
                                                        <img src="https://cdn.brandfetch.io/adidas.com/w/400/h/400" alt="Adidas" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Amazon">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Flipkart">
                                                        <img src="https://cdn.brandfetch.io/flipkart.com/w/400/h/400" alt="Flipkart" style={{ height: '24px', objectFit: 'contain' }} />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="boAt">
                                                        <img src="https://cdn.brandfetch.io/boat-lifestyle.com/w/400/h/400" alt="boAt" />
                                                    </div>
                                                    <div className="lux-marquee__item" aria-label="Coca-Cola">
                                                        <img src="https://upload.wikimedia.org/wikipedia/commons/c/ce/Coca-Cola_logo.svg" alt="Coca-Cola" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                <Sparkles size={40} className="text-violet mb-md mx-auto" style={{ opacity: 0.8 }} />
                                <h2 className="heading-xl font-weight-300">Ready to transform<br />your <span className="text-violet">Content Engine?</span></h2>
                                <p className="body-lg text-muted mt-md mb-lg mx-auto" style={{ maxWidth: '600px' }}>
                                    Stop wasting time on manual outreach. Join the elite network of brands and creators scaling natively with YovoAI.
                                </p>
                                <div className="footer-cta__btn-wrap">
                                    <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary" style={{ padding: '1.25rem 2.5rem' }}>
                                        Start Scaling <ArrowUpRight size={18} />
                                    </a>
                                    <Link to="/landingpage/features" className="home-btn home-btn--outline" style={{ padding: '1.25rem 2.5rem' }}>
                                        View Architecture
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="footer-content mt-xl">
                    <div className="footer-brand">
                        <Link to="/landingpage" className="footer-logo">
                            <span className="footer-logo__text">Yovo<span className="text-violet">AI</span></span>
                        </Link>
                        <p className="footer-desc mt-sm">
                            The intelligent platform for creator-driven marketing.
                            Scale authentic UGC, predict performance, and drive real ROI with AI.
                        </p>
                        <div className="footer-social mt-md">
                            <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
                            <a href="#" aria-label="Twitter"><Twitter size={20} /></a>
                            <a href="#" aria-label="LinkedIn"><Linkedin size={20} /></a>
                            <a href="#" aria-label="Youtube"><Youtube size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-links">
                        <div className="footer-col">
                            <h4 className="footer-col__title">Platform</h4>
                            <ul>
                                <li><Link to="/landingpage/features">Product Overview</Link></li>
                                <li><Link to="/landingpage/for-brands">For Brands</Link></li>
                                <li><Link to="/landingpage/for-creators">For Creators</Link></li>
                                <li><Link to="/landingpage">Pricing</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-col__title">Company</h4>
                            <ul>
                                <li><Link to="/landingpage/about">About Us</Link></li>
                                <li><Link to="/landingpage/contact">Contact</Link></li>
                                <li><Link to="/landingpage">Careers</Link></li>
                                <li><Link to="/landingpage">Blog</Link></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4 className="footer-col__title">Legal</h4>
                            <ul>
                                <li><Link to="/landingpage">Terms of Service</Link></li>
                                <li><Link to="/landingpage/privacy">Privacy Policy</Link></li>
                                <li><Link to="/landingpage">Cookie Policy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom mt-xl">
                    <p>© {new Date().getFullYear()} YovoAI. All rights reserved.</p>
                    <div className="footer-bottom__links">
                        <span>Crafted for Creators.</span>
                    </div>
                </div>
            </div>
        </footer>
    )
}
