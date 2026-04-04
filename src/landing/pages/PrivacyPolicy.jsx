import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <main className="policy-page" style={{ background: 'var(--bg-deep)', color: '#fff', minHeight: '100vh', paddingTop: '10rem', paddingBottom: '10rem' }}>
            <div className="container" style={{ maxWidth: '900px' }}>
                
                {/* ── Header Section ── */}
                <header style={{ marginBottom: '6rem' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--violet-bright)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem', fontWeight: 600 }}>
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="heading-xl" 
                        style={{ fontWeight: 300, marginBottom: '1.5rem' }}
                    >
                        Privacy <span className="text-violet">Policy.</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="body-lg text-muted"
                    >
                        Last updated: March 25, 2026. Your privacy is paramount to our ecosystem.
                    </motion.p>
                </header>

                {/* ── Key Highlights ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '6rem' }}>
                    {[
                        { icon: <Shield className="text-violet" />, title: "Data Security", desc: "Enterprise-grade encryption for all user data." },
                        { icon: <Lock className="text-pink" />, title: "Zero Leaks", desc: "We never sell your personal information." },
                        { icon: <Eye className="text-cyan" />, title: "Transparency", desc: "Clear insight into how your data is used." }
                    ].map((item, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card" 
                            style={{ padding: '2rem', borderRadius: '24px' }}
                        >
                            <div style={{ marginBottom: '1rem' }}>{item.icon}</div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                            <p className="body-sm text-muted">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* ── Policy Content ── */}
                <div className="policy-content" style={{ lineHeight: 1.8, fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)' }}>
                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={24} className="text-violet" /> 1. Introduction
                        </h2>
                        <p>
                            Welcome to YovoAI. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our application (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.
                        </p>
                    </section>

                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={24} className="text-pink" /> 2. The Data We Collect
                        </h2>
                        <p>
                            We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        </p>
                        <ul style={{ paddingLeft: '1.5rem', marginTop: '1rem', listStyleType: 'square' }}>
                            <li style={{ marginBottom: '0.5rem' }}><strong>Identity Data:</strong> includes first name, last name, username or similar identifier.</li>
                            <li style={{ marginBottom: '0.5rem' }}><strong>Contact Data:</strong> includes email address and telephone numbers.</li>
                            <li style={{ marginBottom: '0.5rem' }}><strong>Technical Data:</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
                            <li style={{ marginBottom: '0.5rem' }}><strong>Usage Data:</strong> includes information about how you use our website, products and services.</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={24} className="text-cyan" /> 3. How We Use Your Data
                        </h2>
                        <p>
                            We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        </p>
                        <div className="glass-card" style={{ padding: '2rem', marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)' }}>
                            <p style={{ margin: 0 }}>
                                • To register you as a new customer.<br />
                                • To process and deliver your digital services.<br />
                                • To manage our relationship with you.<br />
                                • To use data analytics to improve our website and marketing resonance.
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={24} className="text-violet" /> 4. Data Security
                        </h2>
                        <p>
                            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
                        </p>
                    </section>

                    <section style={{ marginBottom: '4rem' }}>
                        <h2 style={{ color: '#fff', fontSize: '1.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <FileText size={24} className="text-pink" /> 5. Your Legal Rights
                        </h2>
                        <p>
                            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to receive a copy of the personal data we hold about you and the right to make a complaint at any time to the relevant data protection authority.
                        </p>
                    </section>

                    <div style={{ marginTop: '6rem', padding: '3rem', borderRadius: '32px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(219, 42, 114, 0.1) 100%)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Questions regarding this policy?</h3>
                        <p className="text-muted mb-md">Our legal team is ready to assist you.</p>
                        <Link to="/landingpage/contact" className="home-btn home-btn--primary">Contact Support</Link>
                    </div>
                </div>

            </div>
        </main>
    );
}
