import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, DollarSign, PenTool, Sparkles, TrendingUp, Handshake, Verified, Zap, ShieldCheck, BarChart3, Globe } from 'lucide-react'
import './ForCreators.css'

import creatorBgImg from '../assets/images/forCreate_bg.jpg'
import creatorVrImg from '../assets/images/youngWomanWithVr.png'
import creatorVideo from '../assets/video/man_understad.mp4'
import dashboardMarketing from '../assets/images/dashboard_analysis_marketing.jpg'

gsap.registerPlugin(ScrollTrigger)

export default function ForCreators() {
    const mainRef = useRef(null)

    useEffect(() => {
        let ctx = gsap.context(() => {

            // 1. HERO ENTRANCE (Staggered Load)
            const heroTl = gsap.timeline();
            heroTl.fromTo('.creators-hero__badge-pill', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 })
                .fromTo('.creators-hero__title', { opacity: 0, y: 60, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'expo.out' }, "-=0.6")
                .fromTo('.creators-hero__desc', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, "-=1")
                .fromTo('.creators-hero__btn-group', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, "-=1")
                .fromTo('.creators-hero__img-frame', { opacity: 0, y: 200, rotateX: 20 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.8, ease: 'expo.out' }, "-=1.2");

            // 1.5 HERO SCROLL PARALLAX (Subtle fade and move)
            gsap.to('.creators-hero', {
                yPercent: 15,
                opacity: 0.4,
                scrollTrigger: {
                    trigger: '.creators-hero',
                    start: 'top top',
                    end: 'bottom -50%',
                    scrub: true
                }
            });

            // 2. BENTO GRID 3D STAGGER REVEAL (Falling into place)
            gsap.set('.creators-bento__grid', { perspective: 1500 });
            gsap.utils.toArray('.creators-bento__item').forEach((item, i) => {
                gsap.fromTo(item,
                    { opacity: 0, y: 150, z: -300, rotateX: -30, scale: 0.8 },
                    {
                        opacity: 1, y: 0, z: 0, rotateX: 0, scale: 1,
                        duration: 1.5, ease: 'power4.out',
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 85%'
                        }
                    }
                )
            });

            // 3. VIDEO 3D TILT & ZOOM SCRUB (Intense Apple-style Reveal)
            gsap.set('.creators-video', { perspective: 2000 });
            gsap.fromTo('.creators-video__wrapper',
                { rotateX: 45, scale: 0.7, y: 150, opacity: 0.2, transformOrigin: "bottom center", borderRadius: "80px" },
                {
                    rotateX: 0, scale: 1, y: 0, opacity: 1, borderRadius: "40px",
                    scrollTrigger: {
                        trigger: '.creators-video',
                        start: 'top 90%',
                        end: 'center center',
                        scrub: 1.5
                    }
                }
            );

            // 4. ANALYTICS REVEAL (Blur and Slide Up)
            gsap.fromTo('.creators-analytics__dashboard',
                { y: 200, filter: 'blur(30px)', opacity: 0, scale: 0.9 },
                {
                    y: 0, filter: 'blur(0px)', opacity: 1, scale: 1,
                    duration: 2, ease: "power4.out",
                    scrollTrigger: { trigger: '.creators-analytics', start: 'top 80%' }
                }
            );
            gsap.fromTo('.creators-analytics__title',
                { opacity: 0, x: -50, filter: "blur(10px)" },
                { opacity: 1, x: 0, filter: "blur(0px)", duration: 1.5, ease: "power3.out", scrollTrigger: { trigger: '.creators-analytics', start: 'top 80%' } }
            );

            // 5. HORIZONTAL PINNED PIPELINE
            const pipelineCards = gsap.utils.toArray('.creators-pipeline__card');
            if (pipelineCards.length > 0) {
                gsap.to('.creators-pipeline__scroller', {
                    x: () => {
                        const scroller = document.querySelector('.creators-pipeline__scroller');
                        // Calculate total distance to slide left, leaving some padding on right side
                        return -(scroller.scrollWidth - window.innerWidth + window.innerWidth * 0.1);
                    },
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.creators-pipeline',
                        pin: true,
                        scrub: 1,
                        start: 'center center',
                        end: () => `+=${document.querySelector('.creators-pipeline__scroller').scrollWidth - window.innerWidth}`,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => {
                            // Dynamically activate cards and glow based on scroll progress
                            const index = Math.round(self.progress * (pipelineCards.length - 1));
                            pipelineCards.forEach((c, i) => {
                                if (i === index) c.classList.add('is-active');
                                else c.classList.remove('is-active');
                            });
                        }
                    }
                });
                if (pipelineCards[0]) pipelineCards[0].classList.add('is-active');
            }

            // 6. CTA CIRCULAR MASK EXPAND REVEAL
            gsap.set('.creators-cta__card', { "--spread": "0%" });
            const ctaTl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.creators-cta',
                    start: 'top 75%'
                }
            });
            ctaTl.to('.creators-cta__card', { "--spread": "150%", duration: 2.5, ease: "power4.inOut" })
                .fromTo('.creators-cta__content', { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power3.out" }, "-=1.5");

        }, mainRef)
        return () => ctx.revert()
    }, [])

    return (
        <main ref={mainRef} className="creators-main">

            {/* HERO SECTION */}
            <section className="creators-hero">
                <div className="creators-hero__bg-glow"></div>
                <div className="container">
                    <div className="creators-hero__header">
                        <div className="creators-hero__badge-pill">
                            <Verified size={16} className="text-violet" />
                            <span>Creator Ecosystem</span>
                        </div>
                        <h1 className="creators-hero__title">
                            Monetize Your <span className="text-gradient">Authenticity.</span>
                        </h1>
                        <p className="creators-hero__desc">
                            Stop chasing brand deals and fighting algorithmic fatigue. Step into a luxury creator ecosystem where premium brands come directly to you for authentic, high-converting storytelling.
                        </p>
                        <div className="creators-hero__btn-group">
                            <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary">
                                Apply for Access <ArrowUpRight size={18} />
                            </a>
                            <Link to="/landingpage/features" className="home-btn home-btn--outline">
                                View Perks
                            </Link>
                        </div>
                    </div>

                    <div className="creators-hero__showcase">
                        <div className="creators-hero__img-frame">
                            <img src={creatorBgImg} alt="Creator Recording" className="creators-hero__img" />
                            <div className="creators-hero__overlay-gradient"></div>

                            {/* Floating Glass Widgets */}
                            <motion.div
                                className="creators-widget creators-widget--earnings"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <div className="creators-widget__header">
                                    <span className="creators-widget__label">Earnings this month</span>
                                    <TrendingUp size={16} className="text-violet" />
                                </div>
                                <div className="creators-widget__val">$8,450.00</div>
                                <div className="creators-widget__trend">+24% from last month</div>
                            </motion.div>

                            <motion.div
                                className="creators-widget creators-widget--deal"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            >
                                <div className="creators-widget__icon-wrap">
                                    <Handshake size={20} className="text-violet" />
                                </div>
                                <div>
                                    <div className="creators-widget__title">New Brand Deal</div>
                                    <div className="creators-widget__sub">YSL Beauty &bull; $1,200</div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* BENTO GRID */}
            <section className="creators-bento section">
                <div className="container">
                    <div className="creators-bento__header text-center">
                        <span className="label">The YovoAI Standard</span>
                        <h2 className="heading-xl">Engineered for <span className="text-gradient">Growth.</span></h2>
                    </div>

                    <div className="creators-bento__grid">
                        <div className="creators-bento__item creators-bento__item--large creators-bento__item--dark">
                            <div className="creators-bento__content">
                                <div className="creators-bento__icon">
                                    <DollarSign size={32} />
                                </div>
                                <h3>Guaranteed Escrow Payments</h3>
                                <p>No more chasing overdue invoices. Brands pre-fund campaigns into secure escrow accounts. Once your content is approved, your money is released instantly to your bank account without delays.</p>
                            </div>
                            <div className="creators-bento__bg-glow"></div>
                        </div>

                        <div className="creators-bento__item creators-bento__item--image">
                            <img src={creatorVrImg} alt="Creator in VR" />
                            <div className="creators-bento__overlay">
                                <h3>Direct Brand Access</h3>
                                <p>Skip the agencies. Build long-term partnerships directly.</p>
                            </div>
                        </div>

                        <div className="creators-bento__item creators-bento__item--dark">
                            <div className="creators-bento__content">
                                <div className="creators-bento__icon">
                                    <Sparkles size={28} />
                                </div>
                                <h3>AI Optimization</h3>
                                <p>Leverage built-in tools to craft better hooks, analyze performance, and scale your audience organically.</p>
                            </div>
                        </div>

                        <div className="creators-bento__item creators-bento__item--wide creators-bento__item--dark">
                            <div className="creators-bento__content-flex">
                                <div>
                                    <div className="creators-bento__icon">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <h3>Absolute Creative Freedom</h3>
                                    <p>Brands come to YovoAI for YOUR unique voice. We match you with brands that respect your style, ensuring your content remains authentic to your audience.</p>
                                </div>
                                <div className="creators-bento__metric">
                                    100% <span>Creative Control</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* VIDEO TILT REVEAL */}
            <section className="creators-video">
                <div className="container">
                    <div className="creators-video__wrapper">
                        <video autoPlay loop muted playsInline>
                            <source src={creatorVideo} type="video/mp4" />
                        </video>
                        <div className="creators-video__overlay">
                            <div className="creators-video__overlay-content">
                                <h2>Your <span className="text-gradient">influence</span> has immense value.</h2>
                                <p>Join a community of elite creators who are redefining modern marketing. Turn your passion into a scaleable, predictable business empire.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ANALYTICS BLUR REVEAL (NEW SECTION) */}
            <section className="creators-analytics section">
                <div className="container split">
                    <div className="creators-analytics__content">
                        <span className="label">Intelligent Growth</span>
                        <h2 className="heading-xl creators-analytics__title">Data that drives <span className="text-violet">dominance.</span></h2>
                        <p className="body-lg text-muted mt-md">A dedicated analytics engine tracking every view, click, and conversion your content generates. Know your exact market value and negotiate better deals with real-time performance metrics.</p>

                        <div className="creators-analytics__features mt-lg">
                            <div className="creators-analytics__feat">
                                <BarChart3 className="text-violet" size={24} />
                                <div>
                                    <h4 className="heading-sm">Real-time Attribution</h4>
                                    <p className="body-sm text-muted">See exactly how many sales your videos generated.</p>
                                </div>
                            </div>
                            <div className="creators-analytics__feat">
                                <Globe className="text-violet" size={24} />
                                <div>
                                    <h4 className="heading-sm">Global Benchmarks</h4>
                                    <p className="body-sm text-muted">Compare your engagement against industry standards.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="creators-analytics__visual">
                        <div className="creators-analytics__dashboard">
                            <img src={dashboardMarketing} alt="Analytics Dashboard" />
                            <div className="creators-analytics__dashboard-glow"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HORIZONTAL PINNED PIPELINE */}
            <section className="creators-pipeline">
                <div className="container">
                    <div className="creators-pipeline__header">
                        <span className="label">The Workflow</span>
                        <h2 className="heading-xl">Scale in <span className="text-violet">3 Steps.</span></h2>
                        <p className="body-lg text-muted">We’ve engineered the friction out of the entire creator-brand relationship process.</p>
                    </div>
                </div>

                <div className="creators-pipeline__container">
                    <div className="creators-pipeline__scroller">

                        <div className="creators-pipeline__card">
                            <div className="creators-pipeline__step-num">01</div>
                            <div className="creators-pipeline__card-header">
                                <div className="creators-pipeline__card-icon">
                                    <Zap size={28} />
                                </div>
                                <h3>Calibrate Your Profile</h3>
                            </div>
                            <p>Connect your socials securely and define your unique niche. Our proprietary AI categorizes your audience demographics to silently match you with inbound brand requests without you lifting a finger.</p>
                        </div>

                        <div className="creators-pipeline__card">
                            <div className="creators-pipeline__step-num">02</div>
                            <div className="creators-pipeline__card-header">
                                <div className="creators-pipeline__card-icon">
                                    <PenTool size={28} />
                                </div>
                                <h3>Receive Premium Briefs</h3>
                            </div>
                            <p>Get notified directly on your phone when a tier-1 brand wants to collaborate. Review the creative brief, the timeline, and the pre-funded compensation before you accept ensuring zero risk.</p>
                        </div>

                        <div className="creators-pipeline__card">
                            <div className="creators-pipeline__step-num">03</div>
                            <div className="creators-pipeline__card-header">
                                <div className="creators-pipeline__card-icon">
                                    <Sparkles size={28} />
                                </div>
                                <h3>Submit & Get Paid</h3>
                            </div>
                            <p>Upload your finished content straight through the YovoAI app. Once the brand reviews and approves your submission, your payment is automatically un-escrowed instantly directly to your account.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* CTA CIRCULAR REVEAL */}
            <section className="creators-cta section">
                <div className="container">
                    <div className="creators-cta__card">
                        <div className="creators-cta__content">
                            <Sparkles size={48} className="text-violet creators-cta__icon" />
                            <h2 className="heading-xl">Ready to own your worth?</h2>
                            <p className="body-lg">Join thousands of creators who are already scaling their businesses on YovoAI.</p>
                            <div className="creators-cta__actions">
                                <a href="https://play.google.com/store/apps/details?id=com.diin.yovoai" target="_blank" rel="noreferrer" className="home-btn home-btn--primary">
                                    Download the App <ArrowUpRight size={18} />
                                </a>
                                <Link to="/landingpage/contact" className="home-btn home-btn--white">
                                    Contact Talent Team
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
