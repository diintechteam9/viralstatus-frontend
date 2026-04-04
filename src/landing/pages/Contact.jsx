import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MapPin, Mail, Phone, ArrowUpRight, Plus, Minus, MessageSquare, Send } from 'lucide-react'
import './Contact.css'

gsap.registerPlugin(ScrollTrigger)

export default function Contact() {
    const mainRef = useRef(null)
    const [formStatus, setFormStatus] = useState(null)
    const [activeFaq, setActiveFaq] = useState(null)

    const toggleFaq = (index) => {
        if (activeFaq === index) {
            setActiveFaq(null)
        } else {
            setActiveFaq(index)
        }
    }

    const faqs = [
        {
            q: "How fast can I launch my first campaign?",
            a: "With our AI matchmaking system, approved brands can typically launch their first campaign and receive creator pitches within 24-48 hours of onboarding."
        },
        {
            q: "How does the escrow payment system work?",
            a: "To protect both parties, brands fund campaigns upfront into a secure escrow. Funds are automatically released to the creator ONLY once the content is reviewed and approved."
        },
        {
            q: "Who owns the rights to the content?",
            a: "By default, brands receive full digital usage rights for the content across standard social ad platforms for the duration specified in the campaign brief."
        },
        {
            q: "Are the creators vetted?",
            a: "Absolutely. We have a strict vetting process. Only about 12% of creator applications are accepted, ensuring high-quality, authentic storytelling."
        }
    ]

    useEffect(() => {
        const ctx = gsap.context(() => {

            // 1. HERO REVEAL
            const heroTl = gsap.timeline();
            heroTl.fromTo('.contact-anim-stagger',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.2 }
            );

            // 2. CONTACT CARDS REVEAL
            gsap.fromTo('.contact-card',
                { opacity: 0, y: 50, scale: 0.95 },
                {
                    opacity: 1, y: 0, scale: 1, duration: 1, stagger: 0.1, ease: 'expo.out',
                    scrollTrigger: { trigger: '.contact-cards-section', start: 'top 85%' }
                }
            );

            // 3. MAP REVEAL
            gsap.fromTo('.contact-map-wrapper',
                { opacity: 0, rotateX: 20, transformOrigin: "top center" },
                {
                    opacity: 1, rotateX: 0, duration: 1.5, ease: 'power3.out',
                    scrollTrigger: { trigger: '.contact-map-section', start: 'top 80%' }
                }
            );

            // 4. FAQ REVEAL
            gsap.fromTo('.faq-item',
                { opacity: 0, x: -30 },
                {
                    opacity: 1, x: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out',
                    scrollTrigger: { trigger: '.contact-faq-section', start: 'top 85%' }
                }
            );

        }, mainRef)
        return () => ctx.revert()
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setFormStatus('Sending...')
        setTimeout(() => {
            setFormStatus('Message sent successfully!')
            e.target.reset()
            setTimeout(() => setFormStatus(null), 3000)
        }, 1500)
    }

    return (
        <main ref={mainRef} className="contact-main">

            {/* ═ HERO & FORM ═ */}
            <section className="contact-hero section">
                <div className="contact-hero__glow"></div>
                <div className="container">
                    <div className="contact-grid">

                        {/* Info Left */}
                        <div className="contact-info">
                            <div className="contact-anim-stagger">
                                <span className="label">Get in Touch</span>
                            </div>
                            <h1 className="heading-xl mt-md contact-anim-stagger">
                                Let's build <br className="hide-mobile" /> something <span className="text-violet">great.</span>
                            </h1>
                            <p className="body-lg mt-md text-muted contact-anim-stagger" style={{ maxWidth: '450px' }}>
                                Whether you're a brand looking to scale UGC, or a creator ready to monetize, our team is standing by to help you take that next giant leap.
                            </p>
                        </div>

                        {/* Form Right */}
                        <div className="contact-form-wrap contact-anim-stagger glass-card">
                            <div className="contact-form-header">
                                <MessageSquare size={24} className="text-violet mb-sm" />
                                <h3 className="heading-md">Send a Message</h3>
                            </div>

                            <form onSubmit={handleSubmit} className="contact-form mt-md">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input type="text" id="name" required placeholder="e.g. Rahul Sharma" />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="company">Company</label>
                                        <input type="text" id="company" placeholder="e.g. TATA Group" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Work Email</label>
                                    <input type="email" id="email" required placeholder="rahul@company.com" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="inquiry">I am a...</label>
                                    <div className="select-wrapper">
                                        <select id="inquiry" defaultValue="brand">
                                            <option value="brand">Brand / Marketer</option>
                                            <option value="creator">Content Creator</option>
                                            <option value="agency">Agency</option>
                                            <option value="other">Other Inquiry</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea id="message" rows="4" required placeholder="How can we help you scale today?"></textarea>
                                </div>

                                <button type="submit" className="home-btn home-btn--primary w-full mt-sm form-submit-btn cursor-pointer" disabled={formStatus === 'Sending...'}>
                                    {formStatus || (
                                        <>Send Message <Send size={18} /></>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═ CONTACT CARDS ═ */}
            <section className="contact-cards-section section">
                <div className="container">
                    <div className="contact-cards-grid">

                        <div className="contact-card">
                            <div className="contact-card__glow"></div>
                            <div className="contact-card__icon-wrap">
                                <MapPin size={24} />
                            </div>
                            <h4 className="heading-sm mt-md mb-xs">Headquarters</h4>
                            <p className="body-sm text-muted">
                                Ground floor, C-116, C Block, Sector 2, Noida, Uttar Pradesh 201301
                            </p>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card__icon-wrap">
                                <Mail size={24} />
                            </div>
                            <h4 className="heading-sm mt-md mb-xs">Direct Inquiries</h4>
                            <a href="mailto:contact@yovoai.com" className="body-md text-violet contact-card__link">contact@yovoai.com</a>
                        </div>

                        <div className="contact-card">
                            <div className="contact-card__icon-wrap">
                                <Phone size={24} />
                            </div>
                            <h4 className="heading-sm mt-md mb-xs">Global Support</h4>
                            <a href="tel:+918147540362" className="body-md text-violet contact-card__link">+91 814754 0362</a>
                        </div>

                    </div>
                </div>
            </section>

            {/* ═ MAP VISUAL ═ */}
            <section className="contact-map-section section">
                <div className="container">
                    <div className="contact-map-wrapper glass-card">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3503.5176106127947!2d77.31520150000001!3d28.584244800000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce500236944e9%3A0xbfdce5cf4c20f6aa!2sDiin%20technologies!5e0!3m2!1sen!2sin!4v1773205030161!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="YovoAI Headquarters Map"
                        ></iframe>
                        <div className="contact-map-overlay"></div>
                    </div>
                </div>
            </section>

            {/* ═ FAQ ═ */}
            <section className="contact-faq-section section">
                <div className="container split">
                    <div className="faq-header pr-lg">
                        <span className="label">Common Questions</span>
                        <h2 className="heading-xl mt-sm mb-md">Ask us <span className="text-violet">Anything.</span></h2>
                        <p className="body-lg text-muted">Can't find the answer you're looking for? Reach out to our team using the form above.</p>
                    </div>

                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`faq-item ${activeFaq === index ? 'is-active' : ''}`}
                                onClick={() => toggleFaq(index)}
                            >
                                <div className="faq-item__header">
                                    <h4 className="heading-sm font-bold text-white">{faq.q}</h4>
                                    <div className="faq-item__icon">
                                        {activeFaq === index ? <Minus size={20} className="text-violet" /> : <Plus size={20} />}
                                    </div>
                                </div>
                                <div
                                    className="faq-item__body"
                                    style={{
                                        height: activeFaq === index ? 'auto' : 0,
                                        opacity: activeFaq === index ? 1 : 0,
                                        marginTop: activeFaq === index ? '1rem' : 0
                                    }}
                                >
                                    <p className="body-md text-muted line-height-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </main>
    )
}
