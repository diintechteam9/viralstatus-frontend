import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Target, Users, Zap, Heart, Sparkles, MapPin, Orbit } from 'lucide-react'
import './About.css'

import aboutBg from '../assets/images/about_bgImg.jpg'
import teamDiscussion from '../assets/images/group_discoson.jpg'
import officeSpace from '../assets/images/fpkdl.com_960_1771655178_coworking-space-office-sharing-desk-corporate-workplace-diversity-efficiency-modern-work_926199-2735151.jpg'

gsap.registerPlugin(ScrollTrigger)

export default function About() {
    const mainRef = useRef(null)

    useEffect(() => {
        let ctx = gsap.context(() => {

            // 1. HERO REVEAL
            const heroTl = gsap.timeline();
            heroTl.fromTo('.about-hero__badge', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out', delay: 0.2 })
                .fromTo('.about-hero__title', { opacity: 0, y: 50, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: 'expo.out' }, "-=0.6")
                .fromTo('.about-hero__desc', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, "-=1")
                .fromTo('.about-hero__img-frame', { opacity: 0, y: 150, rotateX: 10 }, { opacity: 1, y: 0, rotateX: 0, duration: 1.8, ease: 'power3.out' }, "-=1");

            // Hero Parallax
            gsap.to('.about-hero__img-frame img', {
                yPercent: 15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.about-hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            });

            // 2. STICKY SCRUB TEXT (MISSION)
            const missionWords = gsap.utils.toArray('.about-mission__text .word');
            gsap.fromTo(missionWords,
                { color: "rgba(255, 255, 255, 0.1)" },
                {
                    color: "rgba(255, 255, 255, 1)",
                    stagger: 0.1,
                    scrollTrigger: {
                        trigger: '.about-mission',
                        start: 'top 30%',
                        end: 'bottom 80%',
                        scrub: 1,
                        pin: true
                    }
                }
            );

            // 3. VALUES BENTO REVEAL
            gsap.set('.about-bento__grid', { perspective: 1500 });
            gsap.utils.toArray('.about-bento__item').forEach((item) => {
                gsap.fromTo(item,
                    { opacity: 0, y: 100, rotateX: -15, scale: 0.9 },
                    {
                        opacity: 1, y: 0, rotateX: 0, scale: 1,
                        duration: 1.2, ease: 'power3.out',
                        scrollTrigger: {
                            trigger: item,
                            start: 'top 85%'
                        }
                    }
                )
            });

            // 4. TIMELINE CARDS (Stacked Scroll)
            const tlCards = gsap.utils.toArray('.about-timeline__card');
            tlCards.forEach((card, i) => {
                gsap.fromTo(card,
                    { opacity: 0, y: 100, scale: 0.9 },
                    {
                        opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out",
                        scrollTrigger: {
                            trigger: card,
                            start: "top 80%"
                        }
                    }
                );
            });

            // 5. GLOBAL COUNTERS
            const numberItems = gsap.utils.toArray('.about-stat__num');
            numberItems.forEach(item => {
                let targetNum = parseInt(item.getAttribute('data-target'));
                gsap.fromTo(item,
                    { innerHTML: 0 },
                    {
                        innerHTML: targetNum,
                        duration: 2.5,
                        snap: { innerHTML: 1 },
                        ease: "power2.out",
                        scrollTrigger: {
                            trigger: '.about-global',
                            start: 'top 80%'
                        }
                    }
                )
            });

        }, mainRef);
        return () => ctx.revert();
    }, []);

    // Helper for word wrapping in Mission
    const textToReveal = "For decades, the advertising industry has relied on interruption. Today, consumers trust people, not corporations. We built YovoAI to decentralize trust and scale human authenticity globally.";
    const words = textToReveal.split(" ").map((word, i) => (
        <span key={i} className="word inline-block mr-3 mb-2">{word}</span>
    ));

    return (
        <main ref={mainRef} className="about-main">

            {/* HERO PARALLAX */}
            <section className="about-hero">
                <div className="about-hero__glow"></div>
                <div className="container">
                    <div className="about-hero__header">
                        <div className="about-hero__badge">
                            <Orbit size={16} className="text-violet" />
                            <span>Our Story</span>
                        </div>
                        <h1 className="about-hero__title heading-xl">
                            Redefining <span className="text-gradient">Authenticity</span><br />
                            At Massive Scale.
                        </h1>
                        <p className="about-hero__desc body-lg">
                            We are a collective of engineers, creators, and data scientists on a mission to democratize marketing.
                        </p>
                    </div>

                    <div className="about-hero__showcase">
                        <div className="about-hero__img-frame">
                            <img src={aboutBg} alt="YovoAI Vision" />
                            <div className="about-hero__overlay"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* HIGH-END MISSION SCRUB */}
            <section className="about-mission">
                <div className="container">
                    <div className="about-mission__wrapper">
                        <p className="about-mission__label label">The Problem</p>
                        <h2 className="about-mission__text heading-xl">
                            {words}
                        </h2>
                    </div>
                </div>
            </section>

            {/* BENTO VALUES GRID */}
            <section className="about-bento section">
                <div className="container">
                    <div className="text-center mb-xl">
                        <span className="label">Principles</span>
                        <h2 className="heading-xl mt-sm">Our <span className="text-violet">Core Values</span></h2>
                    </div>

                    <div className="about-bento__grid">

                        <div className="about-bento__item about-bento__item--large">
                            <div className="about-bento__content">
                                <Heart size={44} className="text-pink mb-md about-bento__icon" />
                                <h3>Radical Authenticity</h3>
                                <p>We prioritize genuine creator voices over highly polished corporate scripts. Truth converts better than fiction.</p>
                            </div>
                            <div className="about-bento__bg-glow about-bento__bg-glow--pink"></div>
                        </div>

                        <div className="about-bento__item">
                            <div className="about-bento__content">
                                <Zap size={36} className="text-violet mb-md about-bento__icon" />
                                <h3>Speed & Scale</h3>
                                <p>We use AI to turn weeks of manual outreach into minutes of seamless automation.</p>
                            </div>
                        </div>

                        <div className="about-bento__item">
                            <div className="about-bento__content">
                                <Users size={36} className="text-cyan mb-md about-bento__icon" />
                                <h3>Creator First</h3>
                                <p>We exist to empower creators. Fair pay, absolute creative freedom, and direct brand relationships.</p>
                            </div>
                        </div>

                        <div className="about-bento__item about-bento__item--wide">
                            <div className="about-bento__content-flex">
                                <div>
                                    <Target size={44} className="text-emerald mb-md about-bento__icon" />
                                    <h3>Data Driven</h3>
                                    <p>We don't guess. We use deep analytics and predictive modeling to ensure every campaign objectively performs.</p>
                                </div>
                                <div className="about-bento__img-wrap">
                                    <img src={teamDiscussion} alt="Team" />
                                </div>
                            </div>
                            <div className="about-bento__bg-glow about-bento__bg-glow--emerald"></div>
                        </div>

                    </div>
                </div>
            </section>

            {/* MODERN VERTICAL TIMELINE */}
            <section className="about-timeline section">
                <div className="container">
                    <div className="split about-timeline__split">
                        <div className="about-timeline__sticky">
                            <span className="label">The Journey</span>
                            <h2 className="heading-xl mt-sm mb-md">How we got <span className="text-gradient">Here.</span></h2>
                            <p className="body-lg text-muted">From a simple concept to a global platform redefining the creator economy.</p>
                        </div>

                        <div className="about-timeline__list">

                            <div className="about-timeline__card">
                                <div className="about-timeline__year">2023</div>
                                <h3>The Inception</h3>
                                <p>Founded by a group of ex-agency marketers who realized the UGC process was broken, slow, and completely unscalable.</p>
                            </div>

                            <div className="about-timeline__card">
                                <div className="about-timeline__year">Mid 2024</div>
                                <h3>AI Integration</h3>
                                <p>Launched our proprietary AI matchmaking engine, instantly reducing campaign setup time from weeks to mere minutes.</p>
                            </div>

                            <div className="about-timeline__card">
                                <div className="about-timeline__year">2025</div>
                                <h3>Global Expansion</h3>
                                <p>Expanded operations to 40+ countries, amassing an exclusive and highly curated network of over 100,000 verified creators.</p>
                            </div>

                            <div className="about-timeline__card about-timeline__card--highlight">
                                <Sparkles className="about-timeline__card-icon text-violet" size={32} />
                                <div className="about-timeline__year text-violet">Today</div>
                                <h3>The New Standard</h3>
                                <p>Processing millions in creator payments monthly, officially becoming the gold standard for authentic, data-driven brand growth.</p>
                            </div>

                        </div>
                    </div>
                </div>
            </section>

            {/* GLOBAL PRESENCE */}
            <section className="about-global section">
                <div className="container">
                    <div className="about-global__wrapper">
                        <img src={officeSpace} alt="Global Office" className="about-global__bg" />
                        <div className="about-global__overlay"></div>

                        <div className="about-global__content">
                            <div className="text-center mb-xl">
                                <MapPin size={48} className="text-violet mx-auto mb-sm" />
                                <h2 className="heading-xl text-white">A truly <span className="text-violet">Global</span> footprint.</h2>
                                <p className="body-lg text-white mt-md mx-auto" style={{ maxWidth: "700px", opacity: 0.9 }}>
                                    Headquartered at the intersection of tech and culture. Our team spans continents to support our worldwide network of creators and brands.
                                </p>
                            </div>

                            <div className="about-stats-container">
                                <div className="about-stat">
                                    <div className="about-stat__val"><span className="about-stat__num" data-target="100">0</span>k+</div>
                                    <div className="about-stat__lbl">Active Creators</div>
                                </div>
                                <div className="about-stat">
                                    <div className="about-stat__val"><span className="about-stat__num" data-target="45">0</span></div>
                                    <div className="about-stat__lbl">Countries globally</div>
                                </div>
                                <div className="about-stat">
                                    <div className="about-stat__val">$<span className="about-stat__num" data-target="50">0</span>m+</div>
                                    <div className="about-stat__lbl">Creator Payouts</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
