import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Play, Sparkles, Activity, Layers, MoveRight, Users, Eye, ArrowRight, Volume2, VolumeX } from 'lucide-react'
import './Home.css'

// Assets
import bgVideo from '../assets/video/homeHeroBg.mp4'
import digitalMarketingVideo from '../assets/video/digital_marketing_laptop.mp4'
import futurasticAi from '../assets/images/forBrandAd.png'
import techStyleDash from '../assets/images/techStyleDash.jpg'
import dashboardMarketing from '../assets/images/dashboard_analysis_marketing.jpg'
import techScreenVideo from '../assets/video/techScreen.mp4'
import womanMarketingVideo from '../assets/video/woman_do_marketing.mp4'
import reel1 from '../assets/reelVideo/reel1.mp4'
import reel2 from '../assets/reelVideo/reel2.mp4'
import reel3 from '../assets/reelVideo/reel3.mp4'

import CircularReelsGallery from '../components/CircularReelsGallery'

gsap.registerPlugin(ScrollTrigger)

export default function Home() {
    const mainRef = useRef(null)
    const featuresRef = useRef(null)
    const [mutedStates, setMutedStates] = useState([true, true, true])
    const { scrollYProgress } = useScroll({
        target: featuresRef,
        offset: ["start end", "end start"]
    })

    const opacity1 = useTransform(scrollYProgress, [0, 0.3, 0.5], [0, 1, 0])
    const opacity2 = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0, 1, 0])
    const opacity3 = useTransform(scrollYProgress, [0.5, 0.7, 1], [0, 1, 0])

    const scale1 = useTransform(scrollYProgress, [0, 0.3], [0.8, 1])
    const scale2 = useTransform(scrollYProgress, [0.3, 0.5], [0.8, 1])
    const scale3 = useTransform(scrollYProgress, [0.5, 0.7], [0.8, 1])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Hero Intro - Staggered 3D Rotation
            const tl = gsap.timeline()
            tl.fromTo('.home-hero__badge',
                { rotationX: -90, opacity: 0, transformOrigin: 'center top' },
                { rotationX: 0, opacity: 1, duration: 1.2, ease: 'back.out(1.7)' }
            )
            tl.fromTo('.home-hero__title .word',
                { rotationY: 90, opacity: 0, transformOrigin: 'left center' },
                { rotationY: 0, opacity: 1, duration: 1.5, stagger: 0.1, ease: 'expo.out' },
                "-=0.8"
            )
            tl.fromTo('.home-hero__desc',
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' },
                "-=1"
            )
            tl.fromTo('.home-hero__actions .home-btn',
                { y: 100, opacity: 0, rotationX: -45 },
                { y: 0, opacity: 1, rotationX: 0, duration: 1.2, stagger: 0.15, ease: 'back.out(1.7)' },
                "-=0.8"
            )

            // Features Panels Entries (Handled via Framer Motion for better viewport interaction)

            // Bento Grid - Wave Cascade
            gsap.fromTo('.home-bento__header',
                { y: 100, opacity: 0, scale: 0.9, rotationX: -45 },
                {
                    y: 0, opacity: 1, scale: 1, rotationX: 0,
                    duration: 1.5, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-bento',
                        start: 'top 70%',
                    }
                }
            )

            gsap.utils.toArray('.home-bento__item').forEach((item, i) => {
                gsap.fromTo(item,
                    { y: 200, rotationX: 90, opacity: 0, transformOrigin: 'center bottom' },
                    {
                        y: 0, rotationX: 0, opacity: 1,
                        duration: 1.8,
                        delay: i * 0.15,
                        ease: 'expo.out',
                        scrollTrigger: {
                            trigger: '.home-bento__grid',
                            start: 'top 65%',
                        }
                    }
                )
            })

            // Image Parallax Reveal - Liquid Morph
            gsap.utils.toArray('.reveal-image').forEach(container => {
                const image = container.querySelector('img')
                const tlImg = gsap.timeline({
                    scrollTrigger: {
                        trigger: container,
                        start: "top 75%",
                    }
                })

                tlImg.fromTo(container,
                    { clipPath: 'circle(0% at 50% 50%)', scale: 1.2 },
                    { clipPath: 'circle(100% at 50% 50%)', scale: 1, duration: 2, ease: 'expo.inOut' }
                )

                if (image) {
                    tlImg.fromTo(image,
                        { scale: 1.5, rotation: 5 },
                        { scale: 1, rotation: 0, duration: 2, ease: 'expo.out' },
                        "-=2"
                    )
                }
            })

            // Bento Grid - Cascading 3D Cards
            gsap.fromTo('.home-bento__header',
                { y: 100, opacity: 0, scale: 0.9 },
                {
                    y: 0, opacity: 1, scale: 1,
                    duration: 1.2, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-bento',
                        start: 'top 70%',
                    }
                }
            )

            gsap.fromTo('.home-bento__item',
                { y: 150, rotationX: 45, opacity: 0, transformOrigin: 'center bottom' },
                {
                    y: 0, rotationX: 0, opacity: 1,
                    duration: 1.5, stagger: 0.2, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-bento__grid',
                        start: 'top 70%',
                    }
                }
            )

            // Intro Section - Magnetic Reveal
            gsap.fromTo('.home-intro__heading',
                { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)', x: -100 },
                {
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)', x: 0,
                    duration: 1.5, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-intro',
                        start: 'top 70%',
                    }
                }
            )

            gsap.fromTo('.home-intro__text',
                { opacity: 0, x: 100, rotationY: 45 },
                {
                    opacity: 1, x: 0, rotationY: 0,
                    duration: 1.2, ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.home-intro',
                        start: 'top 70%',
                    }
                }
            )

            // Stats Animations handled by Framer Motion below

            // Video Showcase - Perspective Reveal
            const mm = gsap.matchMedia();

            mm.add("(max-width: 768px)", () => {
                // Simplified mobile animation
                gsap.fromTo('.home-video-showcase__device',
                    { scale: 0.9, y: 30, opacity: 0 },
                    {
                        scale: 1, y: 0, opacity: 1,
                        duration: 1.2, ease: 'power3.out',
                        scrollTrigger: {
                            trigger: '.home-video-showcase',
                            start: 'top 80%',
                        }
                    }
                )
            });

            mm.add("(min-width: 769px)", () => {
                // Desktop perspective animation
                gsap.fromTo('.home-video-showcase__device',
                    { scale: 0.5, rotationY: -45, opacity: 0, transformOrigin: 'center center' },
                    {
                        scale: 1, rotationY: 0, opacity: 1,
                        duration: 1.8, ease: 'expo.out',
                        scrollTrigger: {
                            trigger: '.home-video-showcase',
                            start: 'top 60%'
                        }
                    }
                )
            });

            gsap.fromTo('.home-video-showcase__feature',
                { x: -50, opacity: 0, rotationZ: -5 },
                {
                    x: 0, opacity: 1, rotationZ: 0,
                    duration: 1, stagger: 0.15, ease: 'back.out(1.5)',
                    scrollTrigger: {
                        trigger: '.home-video-showcase__features',
                        start: 'top 75%'
                    }
                }
            )

            // Premium Section - Holographic Entry
            gsap.fromTo('.home-premium__video-main',
                { scale: 0.3, rotationX: 90, opacity: 0, transformOrigin: 'center bottom' },
                {
                    scale: 1, rotationX: 0, opacity: 1,
                    duration: 2, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-premium',
                        start: 'top 60%'
                    }
                }
            )

            gsap.fromTo('.home-premium__feature-card',
                { x: 100, rotationY: -90, opacity: 0 },
                {
                    x: 0, rotationY: 0, opacity: 1,
                    duration: 1.5, ease: 'back.out(1.7)',
                    scrollTrigger: {
                        trigger: '.home-premium',
                        start: 'top 60%'
                    }
                }
            )

            gsap.fromTo('.home-premium__stat',
                { scale: 0, rotation: 360 },
                {
                    scale: 1, rotation: 0,
                    duration: 1.2, stagger: 0.1, ease: 'elastic.out(1, 0.5)',
                    scrollTrigger: {
                        trigger: '.home-premium__stats',
                        start: 'top 75%'
                    }
                }
            )

            // Dual Marketplace - Split Screen Reveal
            gsap.fromTo('.home-dual__card',
                { clipPath: 'polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)', scale: 0.8 },
                {
                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', scale: 1,
                    duration: 1.8, stagger: 0.3, ease: 'expo.out',
                    scrollTrigger: {
                        trigger: '.home-dual',
                        start: 'top 60%'
                    }
                }
            )

            gsap.fromTo('.home-dual__content',
                { y: 100, opacity: 0, rotationX: 45 },
                {
                    y: 0, opacity: 1, rotationX: 0,
                    duration: 1.5, stagger: 0.2, ease: 'back.out(1.5)',
                    scrollTrigger: {
                        trigger: '.home-dual',
                        start: 'top 50%'
                    }
                }
            )

        }, mainRef)
        return () => ctx.revert()
    }, [])

    return (
        <main ref={mainRef} className="home-main">
            {/* ═ HERO ═ */}
            <section className="home-hero">
                <div className="home-hero__bg">
                    <div className="home-hero__parallax">
                        <video autoPlay loop muted playsInline className="home-hero__video">
                            <source src={bgVideo} type="video/mp4" />
                        </video>
                        <div className="home-hero__overlay"></div>
                        <div className="home-hero__gradient"></div>
                    </div>
                </div>

                <div className="home-hero__content container">
                    <div className="home-hero__badge">
                        <Sparkles size={14} className="home-hero__badge-icon" />
                        <span>YOVO AI Creator Marketing Platform</span>
                    </div>

                    <h1 className="home-hero__title">
                        <div className="line"><span className="word">The</span> <span className="word text-accent">AI</span> <span className="word">Platform</span></div>
                        <div className="line"><span className="word">for</span> <span className="word">Creator-Driven</span> <span className="word">Marketing</span></div>
                    </h1>

                    <p className="home-hero__desc">
                        Connect with top creators, automate organic UGC campaigns, and scale authentic
                        marketing using Yovo AI, the intelligent platform for modern brands.
                    </p>

                    <div className="home-hero__actions">
                        <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary">
                            Launch Campaign <ArrowUpRight size={18} />
                        </a>
                        <Link to="/landingpage/for-creators" className="home-btn home-btn--outline">
                            Join as Creator <Play size={16} />
                        </Link>
                    </div>
                </div>

                <div className="home-hero__scroll-indicator">
                    <div className="home-hero__scroll-line"></div>
                </div>
            </section>

            {/* ═ VIDEO REELS SHOWCASE ═ */}
            <section className="home-reels section">
                <div className="home-reels__bg-glow"></div>
                <div className="container">
                    <div className="home-reels__header text-center" style={{ marginBottom: '3rem' }}>
                        <div className="label" style={{ background: 'transparent', padding: 0, border: 'none', margin: '0 auto 1.5rem', justifyContent: 'center' }}>
                            <span className="label__dot"></span>
                            <span style={{ color: 'var(--text-secondary)' }}>Creator Spotlights</span>
                        </div>
                        <h2 className="heading-md mt-sm" style={{ fontWeight: 400 }}>Real <span className="text-violet">Stories</span>. Real <span className="text-pink">Results</span>.</h2>
                    </div>

                    <div className="home-reels__grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 320px))',
                        gap: '2.5rem',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}>
                        {[
                            { src: reel1, title: 'Strategic Planning', user: '@creator_pro' },
                            { src: reel2, title: 'Campaign Execution', user: '@viral_yovo' },
                            { src: reel3, title: 'Engagement Boost', user: '@marketing_guru' }
                        ].map((reel, index) => (
                            <div key={index} className="home-reels__card glass-card" style={{
                                position: 'relative',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                aspectRatio: '9/16',
                                cursor: 'pointer',
                                transition: 'all 0.5s ease',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 30px 60px rgba(234, 92, 10, 0.4)';
                                    e.currentTarget.style.borderColor = 'var(--violet)';
                                    const overlay = e.currentTarget.querySelector('.home-reels__overlay-gradient');
                                    if (overlay) overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 40%)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    const overlay = e.currentTarget.querySelector('.home-reels__overlay-gradient');
                                    if (overlay) overlay.style.background = 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)';
                                }}
                            >
                                <div className="home-reels__media" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
                                    <video
                                        className="home-reels__video"
                                        muted={mutedStates[index]}
                                        playsInline
                                        loop
                                        autoPlay
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    >
                                        <source src={reel.src} type="video/mp4" />
                                    </video>
                                    <div className="home-reels__overlay-gradient" style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.6) 100%)',
                                        transition: 'all 0.4s ease',
                                        zIndex: 1,
                                        pointerEvents: 'none'
                                    }}></div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const newMutedStates = [...mutedStates];
                                            newMutedStates[index] = !newMutedStates[index];
                                            setMutedStates(newMutedStates);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'rgba(0, 0, 0, 0.4)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            zIndex: 4,
                                            color: '#fff',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234, 92, 10, 0.8)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)' }}
                                    >
                                        {mutedStates[index] ? <VolumeX size={18} /> : <Volume2 size={18} />}
                                    </button>
                                </div>
                                <div className="home-reels__content" style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    width: '100%',
                                    padding: '1.5rem',
                                    zIndex: 3,
                                    pointerEvents: 'none'
                                }}>
                                    <div className="home-reels__user" style={{ fontSize: '0.85rem', color: 'var(--violet-bright)', fontWeight: '600', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{reel.user}</div>
                                    <h4 className="home-reels__title" style={{ fontSize: '1.3rem', color: '#fff', fontWeight: '500', lineHeight: 1.3, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{reel.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═ INTRO / PHILOSOPHY ═ */}
            <section className="home-intro section">
                <div className="home-intro__bg-glow"></div>
                <div className="container split">
                    <div className="home-intro__left">
                        <div className="label text-reveal" style={{ background: 'transparent', padding: 0, border: 'none', marginBottom: '2rem' }}>
                            <span className="label__dot"></span>
                            <span style={{ color: 'var(--text-secondary)' }}>The Paradigm Shift</span>
                        </div>
                        <h2 className="home-intro__heading text-reveal">
                            Marketing <span className="home-intro__heading-italic text-violet">evolved.</span><br />
                            Are you ready?
                        </h2>
                    </div>
                    <div className="home-intro__right">
                        <div className="home-intro__divider text-reveal"></div>
                        <p className="home-intro__text text-reveal">
                            Modern audiences don't trust ads. They trust people. YovoAI replaces traditional,
                            expensive influencer agencies with a streamlined platform where creators and brands
                            collaborate seamlessly.
                            <br /><br />
                            <span style={{ color: '#fff', fontWeight: 500 }}>Powered by AI matchmaking, performance tracking, and automated workflows.</span>
                        </p>
                        <div className="home-intro__stats">
                            <motion.div
                                className="home-intro__stat"
                                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                viewport={{ once: true }}
                            >
                                <span className="home-intro__stat-num">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.4 }}
                                    >3</motion.span>
                                    <span className="text-violet">x</span>
                                </span>
                                <span className="home-intro__stat-label">Higher ROI vs Ads</span>
                                <div className="home-intro__stat-glow"></div>
                            </motion.div>

                            <motion.div
                                className="home-intro__stat"
                                initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                                viewport={{ once: true }}
                            >
                                <span className="home-intro__stat-num">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.6 }}
                                    >10k</motion.span>
                                    <span className="text-violet">+</span>
                                </span>
                                <span className="home-intro__stat-label">Vetted Creators</span>
                                <div className="home-intro__stat-glow"></div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═ CIRCULAR REELS GALLERY ═ */}
            <CircularReelsGallery />

            {/* ═ VIDEO DEMO SHOWCASE ═ */}
            <section className="home-video-showcase section">
                <div className="home-video-showcase__bg-glow"></div>
                <div className="container split">
                    <div className="home-video-showcase__left">
                        <div className="label text-reveal" style={{ background: 'transparent', padding: 0, border: 'none', marginBottom: '2rem' }}>
                            <span className="label__dot"></span>
                            <span style={{ color: 'var(--text-secondary)' }}>Campaign Automation</span>
                        </div>
                        <h2 className="home-video-showcase__heading text-reveal">
                            Scale <span className="home-video-showcase__heading-italic text-violet">Authenticity</span><br />
                            Effortlessly.
                        </h2>
                        <p className="home-video-showcase__text text-reveal">
                            Launch and manage UGC campaigns at lightning speed. Our AI platform finds the perfect creators for your brand, handling outreach and tracking seamlessly.
                        </p>

                        <div className="home-video-showcase__features text-reveal">
                            {['AI-driven creator matchmaking', 'Automated campaign workflows', 'Real-time performance analytics'].map((item, i) => (
                                <div key={i} className="home-video-showcase__feature">
                                    <div className="home-video-showcase__feature-dot"></div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="text-reveal mt-lg">
                            <Link to="/landingpage/features" className="home-btn home-btn--primary" style={{ display: 'inline-flex', width: 'max-content' }}>
                                Explore Features <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>

                    <div className="home-video-showcase__right text-reveal">
                        <div className="home-video-showcase__device">
                            <div className="home-video-showcase__device-glow"></div>
                            <div className="home-video-showcase__iframe-container">
                                <iframe
                                    src="https://www.youtube.com/embed/1pdkiWD5sCw?autoplay=1&mute=1&loop=1&controls=0&playlist=1pdkiWD5sCw&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&playsinline=1"
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    frameBorder="0"
                                    title="YovoAI Demo"
                                    className="home-video-showcase__iframe"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═ THE BENTO GRID (PRODUCT SHOWCASE) ═ */}
            <section className="home-bento section">
                <div className="container">
                    <div className="home-bento__header">
                        <div className="label" style={{ background: 'transparent', padding: 0, border: 'none', margin: '0 auto 1.5rem', justifyContent: 'center' }}>
                            <span className="label__dot"></span>
                            <span style={{ color: 'var(--text-secondary)' }}>The Ecosystem</span>
                        </div>
                        <h2 className="home-bento__heading">
                            Engineered for <span className="home-bento__heading-italic text-violet">Scale.</span>
                        </h2>
                        <p className="home-bento__subtext">
                            A completely unified architecture designed to grow your campaigns from seed to supremacy.
                        </p>
                    </div>

                    <div className="home-bento__grid">
                        {/* Box 1: Large Video */}
                        <div className="home-bento__item home-bento__item--large glass-card">
                            <div className="home-bento__media">
                                <video autoPlay loop muted playsInline className="home-bento__video">
                                    <source src={digitalMarketingVideo} type="video/mp4" />
                                </video>
                                <div className="home-bento__overlay"></div>
                            </div>
                            <div className="home-bento__content">
                                <Activity className="home-bento__icon text-pink" size={24} />
                                <h3 className="heading-md mt-sm">AI Matchmaking</h3>
                                <p className="body-md mt-xs">Our algorithms analyze brand DNA and match you with creators who share your audience and vibe, ensuring maximum resonance.</p>
                            </div>
                        </div>

                        {/* Box 2: Image */}
                        <div className="home-bento__item glass-card">
                            <div className="home-bento__media">
                                <img src={dashboardMarketing} alt="Analytics" className="home-bento__img" />
                                <div className="home-bento__overlay"></div>
                            </div>
                            <div className="home-bento__content">
                                <Layers className="home-bento__icon text-cyan" size={24} />
                                <h3 className="heading-sm mt-sm">Real-time Analytics</h3>
                                <p className="body-sm mt-xs">Track every impression, engagement, and conversion natively.</p>
                            </div>
                        </div>

                        {/* Box 3: Text Focus */}
                        <div className="home-bento__item home-bento__item--dark glass-card">
                            <div className="home-bento__bg-glow"></div>
                            <div className="home-bento__content">
                                <Users className="home-bento__icon text-violet" size={24} />
                                <h3 className="heading-sm mt-sm">Creator CRM</h3>
                                <p className="body-sm mt-xs">Manage all your creator relationships, payments, and deliverables in one centralized hub.</p>
                            </div>
                        </div>


                    </div>
                </div>
            </section>




            {/* ═ HORIZONTAL SCROLL (How it Works) ═ */}
            <section ref={featuresRef} className="home-features">
                <div className="home-features__bg-glow"></div>
                <div className="home-features__sticky">
                    <motion.div
                        className="home-features__header container"
                        initial={{ opacity: 0, y: 100 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        viewport={{ once: true }}
                    >
                        <div className="label" style={{ background: 'transparent', padding: 0, border: 'none', marginBottom: '1rem' }}>
                            <span className="label__dot"></span>
                            <span style={{ color: 'var(--text-secondary)' }}>How it Works</span>
                        </div>
                        <h2 className="home-features__main-heading">The <span className="text-violet">Velocity</span> Pipeline.</h2>
                    </motion.div>

                    <div className="home-features__wrapper">
                        {/* Panel 01 */}
                        <motion.div
                            className="home-features__panel"
                            style={{ opacity: opacity1, scale: scale1 }}
                        >
                            <div className="home-features__panel-inner container split">
                                <motion.div
                                    className="home-features__text"
                                    initial={{ x: -100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    viewport={{ once: false, amount: 0.5 }}
                                >
                                    <motion.span
                                        className="home-features__step"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 0.5, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                    >01</motion.span>
                                    <motion.h3
                                        className="home-features__heading"
                                        initial={{ opacity: 0, x: -50, skewX: 5 }}
                                        whileInView={{ opacity: 1, x: 0, skewX: 0 }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    >Architect your<br /><span className="text-pink">Campaign Strategy.</span></motion.h3>
                                    <motion.p
                                        className="home-features__desc"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    >Define your target ROI, creative constraints, and brand persona. Our AI architect constructs a data-driven bridge to your future audience.</motion.p>
                                    <motion.div
                                        className="home-features__meta"
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                    >
                                        <div className="home-features__meta-item"><span>Targeting</span><span>AI Optimized</span></div>
                                        <div className="home-features__meta-item"><span>Efficiency</span><span>+45% Avg</span></div>
                                    </motion.div>
                                </motion.div>
                                <motion.div
                                    className="home-features__visual glass-card reveal-container"
                                    initial={{ opacity: 0, scale: 0.9, rotateY: 15, y: 30 }}
                                    whileInView={{ opacity: 1, scale: 1, rotateY: 0, y: 0 }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                    viewport={{ once: false, amount: 0.1 }}
                                >
                                    <motion.img
                                        src={futurasticAi}
                                        alt="Strategy"
                                        className="home-features__image"
                                        animate={{ y: [0, -15, 0] }}
                                        transition={{
                                            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                    />
                                    <div className="home-features__visual-overlay"></div>
                                    <div className="visual-shine"></div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Panel 02 */}
                        <motion.div
                            className="home-features__panel"
                            style={{ opacity: opacity2, scale: scale2 }}
                        >
                            <div className="home-features__panel-inner container split">
                                <motion.div
                                    className="home-features__text"
                                    initial={{ x: -100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    viewport={{ once: false, amount: 0.5 }}
                                >
                                    <motion.span
                                        className="home-features__step"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 0.5, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                    >02</motion.span>
                                    <motion.h3
                                        className="home-features__heading"
                                        initial={{ opacity: 0, x: -50, skewX: 5 }}
                                        whileInView={{ opacity: 1, x: 0, skewX: 0 }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    >Elite Creator<br /><span className="text-cyan">Matchmaking.</span></motion.h3>
                                    <motion.p
                                        className="home-features__desc"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    >Bypass the agency noise. We algorithmically connect you with creators who actually share your DNA, ensuring conversion-first partnerships.</motion.p>
                                    <motion.div
                                        className="home-features__meta"
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                    >
                                        <div className="home-features__meta-item"><span>Creators</span><span>Vetted Only</span></div>
                                        <div className="home-features__meta-item"><span>Match Rate</span><span>98.4%</span></div>
                                    </motion.div>
                                </motion.div>
                                <motion.div
                                    className="home-features__visual glass-card reveal-container"
                                    initial={{ opacity: 0, scale: 0.8, rotateX: 10 }}
                                    whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                                    viewport={{ once: false, amount: 0.1 }}
                                >
                                    <div className="ui-mockup">
                                        <div className="ui-mockup__header">
                                            <div className="ui-mockup__dots"><span></span><span></span><span></span></div>
                                            <div className="ui-mockup__title">Messenger v2.0</div>
                                        </div>
                                        <div className="ui-mockup__body">
                                            <div className="ui-mockup__chat">
                                                <motion.div
                                                    className="chat-bubble chat-bubble--left"
                                                    initial={{ x: -50, opacity: 0 }}
                                                    whileInView={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 0.8, duration: 0.5 }}
                                                    viewport={{ once: false }}
                                                >
                                                    The brief is incredible. Ready to start!
                                                </motion.div>
                                                <motion.div
                                                    className="chat-bubble chat-bubble--right"
                                                    initial={{ x: 50, opacity: 0 }}
                                                    whileInView={{ x: 0, opacity: 1 }}
                                                    transition={{ delay: 1.1, duration: 0.5 }}
                                                    viewport={{ once: false }}
                                                >
                                                    Approved. Let's go viral.
                                                </motion.div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="visual-shine"></div>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Panel 03 */}
                        <motion.div
                            className="home-features__panel"
                            style={{ opacity: opacity3, scale: scale3 }}
                        >
                            <div className="home-features__panel-inner container split">
                                <motion.div
                                    className="home-features__text"
                                    initial={{ x: -100, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    viewport={{ once: false, amount: 0.5 }}
                                >
                                    <motion.span
                                        className="home-features__step"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 0.5, y: 0 }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                    >03</motion.span>
                                    <motion.h3
                                        className="home-features__heading"
                                        initial={{ opacity: 0, x: -50, skewX: 5 }}
                                        whileInView={{ opacity: 1, x: 0, skewX: 0 }}
                                        transition={{ duration: 0.8, delay: 0.3 }}
                                    >Autonomous Growth<br /><span className="text-violet">& Intelligence.</span></motion.h3>
                                    <motion.p
                                        className="home-features__desc"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 1, delay: 0.5 }}
                                    >Watch your campaigns evolve. Real-time attribution tracking and automated payouts allow you to scale your brand while you sleep.</motion.p>
                                    <motion.div
                                        className="home-features__meta"
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                    >
                                        <div className="home-features__meta-item"><span>Reports</span><span>Real-time</span></div>
                                        <div className="home-features__meta-item"><span>Status</span><span>Scaling</span></div>
                                    </motion.div>
                                </motion.div>
                                <motion.div
                                    className="home-features__visual glass-card reveal-container"
                                    initial={{ opacity: 0, scale: 1.1, rotateY: -15, x: 50 }}
                                    whileInView={{ opacity: 1, scale: 1, rotateY: 0, x: 0 }}
                                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                    viewport={{ once: false, amount: 0.1 }}
                                >
                                    <motion.img
                                        src={dashboardMarketing}
                                        alt="Growth"
                                        className="home-features__image"
                                        animate={{ y: [0, 15, 0] }}
                                        transition={{
                                            y: { duration: 5, repeat: Infinity, ease: "easeInOut" }
                                        }}
                                    />
                                    <div className="home-features__visual-overlay"></div>
                                    <div className="visual-shine"></div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═ TWO SIDED MARKETPLACE ═ */}
            <section className="home-dual section">
                <div className="container">
                    <div className="home-dual__grid">
                        <div className="home-dual__card">
                            <div className="home-dual__bg home-dual__bg--brands"></div>
                            <div className="home-dual__content">
                                <span className="label">For Brands</span>
                                <h2 className="heading-md mt-sm">Unlock Authentic Growth</h2>
                                <p className="body-md mt-sm">Stop burning money on ignored ads. Partner with creators who speak directly to your target demographic.</p>
                                <ul className="home-dual__list mt-md">
                                    <li>Automated creator sourcing</li>
                                    <li>Secure escrow payments</li>
                                    <li>Full usage rights management</li>
                                </ul>
                                <Link to="/landingpage/for-brands" className="home-btn home-btn--white mt-lg">Brand Solutions <ArrowUpRight size={16} /></Link>
                            </div>
                        </div>

                        <div className="home-dual__card">
                            <div className="home-dual__bg home-dual__bg--creators"></div>
                            <div className="home-dual__content">
                                <span className="label">For Creators</span>
                                <h2 className="heading-md mt-sm">Monetize Your Influence</h2>
                                <p className="body-md mt-sm">Work with premium brands on your own terms. Get paid fairly, on time, without agency middlemen.</p>
                                <ul className="home-dual__list mt-md">
                                    <li>Direct brand partnerships</li>
                                    <li>Guaranteed payments</li>
                                    <li>Creative freedom</li>
                                </ul>
                                <Link to="/landingpage/for-creators" className="home-btn home-btn--white mt-lg">Creator Hub <ArrowUpRight size={16} /></Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═ PREMIUM SHOWCASE ═ */}
            <section className="home-premium section">
                <div className="home-premium__bg-glow"></div>
                <div className="container">
                    <div className="home-premium__header text-center">
                        <div className="label">The Future</div>
                        <h2 className="heading-lg mt-sm">Where <span className="text-violet">Innovation</span><br />Meets Excellence.</h2>
                        <p className="body-lg mt-md">Experience the next generation of creator marketing with cutting-edge AI technology.</p>
                    </div>

                    <div className="home-premium__showcase">
                        <div className="home-premium__video-main">
                            <video autoPlay loop muted playsInline className="home-premium__video">
                                <source src={techScreenVideo} type="video/mp4" />
                            </video>
                            <div className="home-premium__overlay"></div>
                        </div>

                        <div className="home-premium__side">
                            <div className="home-premium__feature-card">
                                <div className="home-premium__feature-icon">
                                    <Eye size={24} />
                                </div>
                                <h3>AI Vision</h3>
                                <p>Advanced computer vision analyzes content performance in real-time.</p>
                            </div>
                            <div className="home-premium__stats">
                                <div className="home-premium__stat">
                                    <span className="home-premium__stat-num">99.7%</span>
                                    <span className="home-premium__stat-label">Success Rate</span>
                                </div>
                                <div className="home-premium__stat">
                                    <span className="home-premium__stat-num">24/7</span>
                                    <span className="home-premium__stat-label">AI Support</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
