import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Cpu, Network, ShieldCheck, Zap, Database, Wand2, Sparkles, TrendingUp, Users, Eye, CheckCircle } from 'lucide-react'
import './Features.css'

import techStyleDash from '../assets/images/techStyleDash.jpg'
import visualDashbord from '../assets/images/visualDashbord.jpg'
import contentReading from '../assets/images/people_standwithbord.jpg'
import dashboardMarketing from '../assets/images/dashboard_analysis_marketing.jpg'
import futurasticAi from '../assets/images/futurasticAi.jpg'
import multimarketing from '../assets/images/multimarketing.png'

import MarqueeReelsGallery from '../components/MarqueeReelsGallery'

gsap.registerPlugin(ScrollTrigger)

export default function Features() {
    const mainRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero animations
            gsap.fromTo('.features-hero__badge',
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.7)' }
            )

            gsap.fromTo('.features-hero__title',
                { y: 100, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: 0.3 }
            )

            // Cards animation
            gsap.utils.toArray('.features-card').forEach((card, i) => {
                gsap.fromTo(card,
                    { y: 100, opacity: 0, rotationX: 45 },
                    {
                        y: 0, opacity: 1, rotationX: 0,
                        duration: 1, ease: 'expo.out',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 80%'
                        }
                    }
                )
            })

        }, mainRef)
        return () => ctx.revert()
    }, [])

    return (
        <main ref={mainRef} className="features-main">
            {/* HERO */}
            <section className="features-hero">
                <div className="container">
                    <div className="features-hero__badge">
                        <Sparkles size={16} />
                        <span>Platform Features</span>
                    </div>

                    <h1 className="features-hero__title">
                        Built for the <span className="text-gradient">Creator Economy.</span><br />
                        Powered by AI.
                    </h1>

                    <p className="features-hero__desc">
                        YovoAI is a comprehensive ecosystem that replaces fragmented tools and expensive agencies
                        with a single, intelligent interface designed for unprecedented scale.
                    </p>

                    <div className="features-hero__images">
                        <motion.div
                            className="features-hero__img"
                            whileHover={{ scale: 1.05, y: -10 }}
                        >
                            <img src={dashboardMarketing} alt="Dashboard" />
                        </motion.div>
                        <motion.div
                            className="features-hero__img features-hero__img--large"
                            whileHover={{ scale: 1.03 }}
                        >
                            <img src={techStyleDash} alt="Platform" />
                            <div className="features-hero__glow"></div>
                        </motion.div>
                        <motion.div
                            className="features-hero__img"
                            whileHover={{ scale: 1.05, y: -10 }}
                        >
                            <img src={visualDashbord} alt="Analytics" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* STATS */}
            <section className="features-stats section">
                <div className="container">
                    <div className="features-stats__grid">
                        <motion.div
                            className="features-stat"
                            whileHover={{ scale: 1.1, rotate: 3 }}
                        >
                            <Users size={24} className="features-stat__icon" />
                            <div className="features-stat__num">10K+</div>
                            <div className="features-stat__label">Active Creators</div>
                        </motion.div>
                        <motion.div
                            className="features-stat"
                            whileHover={{ scale: 1.1, rotate: 3 }}
                        >
                            <TrendingUp size={24} className="features-stat__icon" />
                            <div className="features-stat__num">500+</div>
                            <div className="features-stat__label">Brand Partners</div>
                        </motion.div>
                        <motion.div
                            className="features-stat"
                            whileHover={{ scale: 1.1, rotate: 3 }}
                        >
                            <Eye size={24} className="features-stat__icon" />
                            <div className="features-stat__num">2M+</div>
                            <div className="features-stat__label">Content Pieces</div>
                        </motion.div>
                        <motion.div
                            className="features-stat"
                            whileHover={{ scale: 1.1, rotate: 3 }}
                        >
                            <Sparkles size={24} className="features-stat__icon" />
                            <div className="features-stat__num">98%</div>
                            <div className="features-stat__label">Success Rate</div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CORE FEATURES - BENTO STYLE */}
            <section className="features-core section">
                <div className="container">
                    <div className="features-core__header">
                        <h2 className="heading-lg">Core <span className="text-violet">Capabilities</span></h2>
                        <p className="body-lg">Powered by cutting-edge AI technology</p>
                    </div>

                    <div className="features-bento">
                        {/* Large Card with Video/Image */}
                        <motion.div
                            className="features-bento__large"
                            whileHover={{ scale: 1.02, rotateY: 2 }}
                        >
                            <div className="features-bento__bg">
                                <img src={futurasticAi} alt="AI" />
                                <div className="features-bento__gradient"></div>
                            </div>
                            <div className="features-bento__content">
                                <div className="features-bento__icon-large">
                                    <Cpu size={40} />
                                </div>
                                <h3>Intelligent Matchmaking</h3>
                                <p>Neural network analyzes millions of data points for perfect creator-brand matches</p>
                            </div>
                        </motion.div>

                        {/* Tall Card */}
                        <motion.div
                            className="features-bento__tall"
                            whileHover={{ y: -10, scale: 1.03 }}
                        >
                            <div className="features-bento__icon">
                                <Wand2 size={32} />
                            </div>
                            <h4>AI Brief Generator</h4>
                            <p>Transform goals into conversion-optimized creative briefs instantly</p>
                            <div className="features-bento__badge">AI Powered</div>
                        </motion.div>

                        {/* Wide Card */}
                        <motion.div
                            className="features-bento__wide"
                            whileHover={{ x: 5, scale: 1.02 }}
                        >
                            <div className="features-bento__split">
                                <div className="features-bento__icon">
                                    <Database size={28} />
                                </div>
                                <div>
                                    <h4>Real-time Attribution</h4>
                                    <p>Pixel-perfect tracking of every view, click, and conversion</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Square Card */}
                        <motion.div
                            className="features-bento__square"
                            whileHover={{ rotate: 2, scale: 1.05 }}
                        >
                            <div className="features-bento__icon">
                                <Network size={28} />
                            </div>
                            <h4>Automated Workflows</h4>
                            <p>Save hundreds of hours monthly</p>
                        </motion.div>

                        {/* Square Card 2 */}
                        <motion.div
                            className="features-bento__square"
                            whileHover={{ rotate: -2, scale: 1.05 }}
                        >
                            <div className="features-bento__icon">
                                <ShieldCheck size={28} />
                            </div>
                            <h4>Brand Safety</h4>
                            <p>Advanced analysis ensures brand compliance</p>
                        </motion.div>

                        {/* Wide Card 2 */}
                        <motion.div
                            className="features-bento__wide"
                            whileHover={{ x: 5, scale: 1.02 }}
                        >
                            <div className="features-bento__split">
                                <div className="features-bento__icon">
                                    <Zap size={28} />
                                </div>
                                <div>
                                    <h4>Predictive Scaling</h4>
                                    <p>AI identifies breakout content for maximum impact</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═ HORIZONTAL SCROLLING MARQUEE GALLERY ═ */}
            <MarqueeReelsGallery />

            {/* SHOWCASE */}
            <section className="features-showcase section">
                <div className="container">
                    <div className="features-showcase__split">
                        <motion.div
                            className="features-showcase__content"
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true }}
                        >
                            <span className="label">Innovation</span>
                            <h2 className="heading-lg">
                                The Future of <span className="text-violet">Marketing</span>
                            </h2>
                            <p className="body-md">
                                Experience the next generation of creator marketing with cutting-edge AI technology
                                that transforms how brands and creators collaborate at scale.
                            </p>
                            <ul className="features-showcase__list">
                                <li><CheckCircle size={20} /> AI-powered content optimization</li>
                                <li><CheckCircle size={20} /> Multi-platform distribution</li>
                                <li><CheckCircle size={20} /> Advanced performance tracking</li>
                                <li><CheckCircle size={20} /> Automated creator payments</li>
                            </ul>
                        </motion.div>

                        <motion.div
                            className="features-showcase__image"
                            whileHover={{ scale: 1.02 }}
                        >
                            <img src={multimarketing} alt="AI Technology" />
                            <div className="features-showcase__overlay"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* INTEGRATIONS */}
            <section className="features-integrations section">
                <div className="container">
                    <div className="features-integrations__header">
                        <span className="label">Ecosystem</span>
                        <h2 className="heading-lg">Seamless <span className="text-cyan">Integrations</span></h2>
                        <p className="body-md">
                            Connect your existing tech stack instantly. We integrate natively with your
                            CRM, eCommerce platform, and analytics tools for a unified workflow.
                        </p>
                    </div>

                    <motion.div
                        className="features-integrations__image"
                        initial={{ scale: 0.5, opacity: 0, rotateX: 45 }}
                        whileInView={{ scale: 1, opacity: 1, rotateX: 0 }}
                        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                        viewport={{ once: false, amount: 0.3 }}
                        whileHover={{ scale: 1.03, y: -10 }}
                    >
                        <motion.img
                            src={contentReading}
                            alt="Integrations"
                            initial={{ scale: 1.5 }}
                            whileInView={{ scale: 1 }}
                            transition={{ duration: 2, ease: "easeOut" }}
                            viewport={{ once: false, amount: 0.3 }}
                        />
                        <div className="features-integrations__glow"></div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
