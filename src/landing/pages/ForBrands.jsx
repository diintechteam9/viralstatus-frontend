import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Target, TrendingUp, Shield, Zap, Search, Key, CheckCircle, Users, BarChart3, Sparkles } from 'lucide-react'
import './ForBrands.css'

import brandBgImg from '../assets/images/ForBranadCam.jpg'
import brandSectionImg from '../assets/images/forBrandSection.jpg'
import groupMeeting from '../assets/images/meatings.jpg'
import brandPeopleVideo from '../assets/video/people_doing_marketing.mp4'
import dashboardMarketing from '../assets/images/dashboard_analysis_marketing.jpg'

gsap.registerPlugin(ScrollTrigger)

export default function ForBrands() {
    const mainRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero
            gsap.fromTo('.brands-hero__title',
                { y: 80, opacity: 0, rotationX: -45 },
                { y: 0, opacity: 1, rotationX: 0, duration: 1.5, ease: 'expo.out', delay: 0.2 }
            )
            gsap.fromTo('.brands-hero__desc',
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: 'power2.out', delay: 0.5 }
            )
            // Value Animations
            gsap.fromTo('.brands-value__header',
                { opacity: 0, y: 50 },
                {
                    opacity: 1, y: 0,
                    duration: 1.2, ease: 'expo.out',
                    scrollTrigger: { trigger: '.brands-value', start: 'top 75%' }
                }
            )

            gsap.utils.toArray('.anim-premium-item').forEach((item, i) => {
                gsap.fromTo(item,
                    { opacity: 0, x: -50, rotateX: 20 },
                    {
                        opacity: 1, x: 0, rotateX: 0,
                        duration: 1.2, ease: 'power3.out',
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 85%',
                        }
                    }
                )
            })

            // Video Reveal - KEEP THIS ANIMATION
            gsap.fromTo('.brands-video__wrapper',
                { clipPath: 'inset(35% 25% 35% 25% round 60px)', scale: 0.8 },
                {
                    clipPath: 'inset(0% 0% 0% 0% round 0px)',
                    scale: 1,
                    duration: 1.5,
                    ease: 'power3.inOut',
                    scrollTrigger: {
                        trigger: '.brands-video',
                        start: 'top 40%',
                        end: 'center center',
                        scrub: true
                    }
                }
            )

            // Stats Counter
            gsap.fromTo('.brands-stat__num',
                { innerHTML: 0 },
                {
                    innerHTML: function (i, target) { return target.getAttribute('data-value') },
                    duration: 2,
                    snap: { innerHTML: 1 },
                    scrollTrigger: { trigger: '.brands-stats', start: 'top 80%' }
                }
            )

            // Process Cards Sticky Animation
            gsap.utils.toArray('.anim-process-card').forEach((card, i) => {
                gsap.fromTo(card,
                    { y: 80, opacity: 0.3, scale: 0.95 },
                    {
                        y: 0, opacity: 1, scale: 1,
                        duration: 1, ease: 'easeOut',
                        scrollTrigger: {
                            trigger: card,
                            start: 'top 85%',
                        }
                    }
                )

                // Add active class when in center
                ScrollTrigger.create({
                    trigger: card,
                    start: 'top 55%',
                    end: 'bottom 35%',
                    toggleClass: 'is-active'
                })
            })

        }, mainRef)
        return () => ctx.revert()
    }, [])

    return (
        <main ref={mainRef} className="brands-main">
            {/* HERO */}
            <section className="brands-hero">
                <div className="brands-hero__bg">
                    <img src={brandBgImg} alt="Brand Marketing" />
                    <div className="brands-hero__overlay"></div>
                </div>

                <div className="container brands-hero__content">
                    <span className="label">For Brands</span>
                    <h1 className="brands-hero__title">
                        Scale Authentic <br className="hide-mobile" /> <span className="text-gradient">Marketing.</span>
                    </h1>
                    <p className="brands-hero__desc">
                        Ditch the traditional ad formats. Connect directly with vetted creators to
                        generate high-performing, authentic UGC that drives real ROI.
                    </p>
                    <div className="brands-hero__actions">
                        <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary">
                            Start Campaign <ArrowUpRight size={18} />
                        </a>
                        <Link to="/landingpage/features" className="home-btn home-btn--outline">
                            View Features
                        </Link>
                    </div>
                </div>
            </section>

            {/* VALUE PROPOSITION - PREMIUM FLOW */}
            <section className="brands-value section">
                <div className="container">
                    <div className="brands-value__header">
                        <span className="label">The YovoAI Advantage</span>
                        <h2 className="heading-xl">Beyond <span className="text-gradient">Traditional</span> Discovery.</h2>
                    </div>

                    <div className="brands-value__premium-list">
                        <div className="brands-value__list-item anim-premium-item">
                            <div className="brands-value__item-header">
                                <div className="brands-value__item-icon">
                                    <Search size={32} />
                                </div>
                                <h3>AI-Powered Discovery</h3>
                            </div>
                            <div className="brands-value__item-content">
                                <p>Stop scrolling endless feeds. Let our proprietary algorithm find the perfect creator demographic match for your brand instantly, analyzing performance history and audience overlap.</p>
                            </div>
                        </div>

                        <div className="brands-value__list-item anim-premium-item">
                            <div className="brands-value__item-header">
                                <div className="brands-value__item-icon">
                                    <TrendingUp size={32} />
                                </div>
                                <h3>Conversion-First Architecture</h3>
                            </div>
                            <div className="brands-value__item-content">
                                <p>UGC converts 4x better than studio ads. We prioritize authentic narratives that drive tangible ROI and scalable high-quality content across all digital touchpoints.</p>
                                <div className="brands-value__item-metric">4x</div>
                            </div>
                        </div>

                        <div className="brands-value__list-item anim-premium-item">
                            <div className="brands-value__item-header">
                                <div className="brands-value__item-icon">
                                    <Key size={32} />
                                </div>
                                <h3>Full Asset Ownership</h3>
                            </div>
                            <div className="brands-value__item-content">
                                <p>Secure absolute commercial rights from day one. Repurpose, slice, and scale your content across all platforms seamlessly without hidden licensing fees.</p>
                                <div className="brands-value__item-badge">100% Rights</div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* VIDEO IMMERSION - KEEP ANIMATION */}
            <section className="brands-video">
                <div className="brands-video__wrapper">
                    <video autoPlay loop muted playsInline>
                        <source src={brandPeopleVideo} type="video/mp4" />
                    </video>
                    <div className="brands-video__overlay">
                        <div className="brands-video__overlay-content">
                            <h2>Your <span className="text-gradient">brand</span> is what<br />they say it is.</h2>
                            <p>Transform your narrative by partnering with authentic creators who resonate with your target demographic. Build trust at scale, drive meaningful engagement, and turn conversations into conversions.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* STORY SPLIT */}
            <section className="brands-story section">
                <div className="container">
                    <div className="brands-story__split">
                        <motion.div
                            className="brands-story__image"
                            initial={{ x: -100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true }}
                        >
                            <img src={brandSectionImg} alt="Marketing Strategy" />
                        </motion.div>

                        <motion.div
                            className="brands-story__content"
                            initial={{ x: 100, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            transition={{ duration: 1 }}
                            viewport={{ once: true }}
                        >
                            <span className="label">The Shift</span>
                            <h2 className="heading-lg">A New Standard of <span className="text-violet">Trust.</span></h2>
                            <p className="body-md">
                                Today's consumers are blind to corporate messaging. They seek peer validation,
                                authentic storytelling, and relatable faces.
                            </p>
                            <p className="body-md">
                                YovoAI bridges the gap between your marketing objectives and creator authenticity.
                                We provide the infrastructure to run hundred-creator campaigns as easily as buying
                                a programmatic ad.
                            </p>

                            <ul className="brands-story__list">
                                <li><CheckCircle size={20} /> Guaranteed Delivery & Refund Protection</li>
                                <li><CheckCircle size={20} /> Demographically Verified Audiences</li>
                                <li><CheckCircle size={20} /> Automated Campaign Workflows</li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* PROCESS - PREMIUM STICKY FLOW */}
            <section className="brands-process">
                <div className="container">
                    <div className="brands-process__grid">

                        {/* Sticky Left Side */}
                        <div className="brands-process__sticky">
                            <span className="label">The Pipeline</span>
                            <h2 className="heading-lg">How It <span className="text-violet">Works</span></h2>
                            <p className="body-lg text-muted">Launch campaigns in minutes, not weeks. Experience the fastest path to authentic UGC.</p>
                        </div>

                        {/* Scrolling Right Side */}
                        <div className="brands-process__scroller">

                            <div className="brands-process__card anim-process-card">
                                <div className="brands-process__step-num">01</div>
                                <div className="brands-process__card-header">
                                    <div className="brands-process__card-icon">
                                        <Target size={28} />
                                    </div>
                                    <h3>Define Your Campaign</h3>
                                </div>
                                <p>Set your goals, budget, and target audience. Our AI ingests your brand guidelines and generates the perfect creative brief automatically.</p>
                            </div>

                            <div className="brands-process__card anim-process-card">
                                <div className="brands-process__step-num">02</div>
                                <div className="brands-process__card-header">
                                    <div className="brands-process__card-icon">
                                        <Users size={28} />
                                    </div>
                                    <h3>AI Matchmaking</h3>
                                </div>
                                <p>Get matched instantly with vetted creators whose audience precisely aligns with your ideal customer profile and brand values.</p>
                            </div>

                            <div className="brands-process__card anim-process-card">
                                <div className="brands-process__step-num">03</div>
                                <div className="brands-process__card-header">
                                    <div className="brands-process__card-icon">
                                        <Shield size={28} />
                                    </div>
                                    <h3>Review & Approve</h3>
                                </div>
                                <p>Creators submit watermark-protected content. Request revisions directly on the platform or approve with a single click to secure commercial rights.</p>
                            </div>

                            <div className="brands-process__card anim-process-card">
                                <div className="brands-process__step-num">04</div>
                                <div className="brands-process__card-header">
                                    <div className="brands-process__card-icon">
                                        <Zap size={28} />
                                    </div>
                                    <h3>Scale Automatically</h3>
                                </div>
                                <p>Track conversion performance in real-time. Automatically double-down and scale winning content through our programmatic amplification tools.</p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* DASHBOARD PREVIEW */}
            <section className="brands-dashboard section">
                <div className="container">
                    <div className="brands-dashboard__header">
                        <span className="label">Platform</span>
                        <h2 className="heading-lg">All-in-One <span className="text-violet">Dashboard</span></h2>
                        <p className="body-md">Manage campaigns, creators, and analytics from a single interface</p>
                    </div>

                    <motion.div
                        className="brands-dashboard__image"
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.2 }}
                        viewport={{ once: true }}
                        whileHover={{ scale: 1.02 }}
                    >
                        <img src={dashboardMarketing} alt="Dashboard" />
                        <div className="brands-dashboard__glow"></div>
                    </motion.div>
                </div>
            </section>

            {/* STATS */}
            <section className="brands-stats section">
                <div className="container">
                    <div className="brands-stats__grid">
                        <motion.div
                            className="brands-stat"
                            whileHover={{ scale: 1.05, rotate: 2 }}
                        >
                            <div className="brands-stat__icon">
                                <TrendingUp size={24} />
                            </div>
                            <div className="brands-stat__num-wrap">
                                <span className="brands-stat__num" data-value="85">0</span>%
                            </div>
                            <div className="brands-stat__label">Decrease in CPA</div>
                        </motion.div>

                        <motion.div
                            className="brands-stat"
                            whileHover={{ scale: 1.05, rotate: 2 }}
                        >
                            <div className="brands-stat__icon">
                                <BarChart3 size={24} />
                            </div>
                            <div className="brands-stat__num-wrap">
                                <span className="brands-stat__num" data-value="400">0</span>%
                            </div>
                            <div className="brands-stat__label">Increase in CTR</div>
                        </motion.div>

                        <motion.div
                            className="brands-stat"
                            whileHover={{ scale: 1.05, rotate: 2 }}
                        >
                            <div className="brands-stat__icon">
                                <Zap size={24} />
                            </div>
                            <div className="brands-stat__num-wrap">
                                <span className="brands-stat__num" data-value="12">0</span>x
                            </div>
                            <div className="brands-stat__label">Faster Production</div>
                        </motion.div>

                        <motion.div
                            className="brands-stat"
                            whileHover={{ scale: 1.05, rotate: 2 }}
                        >
                            <div className="brands-stat__icon">
                                <Users size={24} />
                            </div>
                            <div className="brands-stat__num-wrap">
                                <span className="brands-stat__num" data-value="500">0</span>+
                            </div>
                            <div className="brands-stat__label">Brand Partners</div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="brands-cta section">
                <div className="container">
                    <div className="brands-cta__content">
                        <Sparkles size={40} className="brands-cta__icon" />
                        <h2 className="heading-xl">Ready to Scale?</h2>
                        <p className="body-lg">
                            Join the world's fastest-growing brands leveraging YovoAI's creator network.
                        </p>
                        <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary">
                            Start Your First Campaign <ArrowUpRight size={18} />
                        </a>
                    </div>
                </div>
            </section>
        </main>
    )
}
