import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValueEvent } from 'framer-motion';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

import reel1 from '../assets/reelVideo/reel9.mp4';
import reel2 from '../assets/reelVideo/reel10.mp4';
import reel3 from '../assets/reelVideo/reel11.mp4';
import reel4 from '../assets/reelVideo/reel4.mp4';
import reel5 from '../assets/reelVideo/reel5.mp4';
import reel6 from '../assets/reelVideo/reel6.mp4';
import reel7 from '../assets/reelVideo/reel7.mp4';
import reel8 from '../assets/reelVideo/reel8.mp4';

const CHUNK_1 = [reel1, reel2, reel3, reel4];
const CHUNK_2 = [reel5, reel6, reel7, reel8];

// Separate Component for Mobile Cards to avoid Rule of Hooks violation
const MobileReelCard = ({ src, index, scrollYProgress, isMuted, toggleMute }) => {
    // Balanced distribution for high-end 3D scroll
    const cardStart = index * 0.18; 
    const cardEnd = Math.min(cardStart + 0.52, 1);

    const y = useTransform(scrollYProgress, [cardStart, cardStart + 0.22, cardEnd], [150, 0, -100]);
    const opacity = useTransform(scrollYProgress, [cardStart, cardStart + 0.18, cardEnd - 0.15, cardEnd], [0, 1, 1, 0]);
    const scale = useTransform(scrollYProgress, [cardStart, cardStart + 0.22, cardEnd], [0.8, 1, 0.9]);
    const rotateX = useTransform(scrollYProgress, [cardStart, cardStart + 0.22, cardEnd], [28, 0, -25]);
    const rotateZ = useTransform(scrollYProgress, [cardStart, cardStart + 0.22, cardEnd], [10, 0, -5]);
    const skewY = useTransform(scrollYProgress, [cardStart, cardStart + 0.22, cardEnd], [6, 0, -4]);

    return (
        <motion.div
            style={{
                y, opacity, scale, rotateX, rotateZ, skewY,
                perspective: '1200px',
                width: '88vw', maxWidth: '340px', aspectRatio: '9/16',
                borderRadius: '32px', overflow: 'hidden',
                boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 40px rgba(234, 92, 10, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: '#0a0a0a', position: 'relative'
            }}
        >
            <video
                src={src}
                muted={isMuted}
                autoPlay
                loop
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 60%)' }} />
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', zIndex: 5 }}>
                <div style={{ color: 'var(--violet-bright)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Performance</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontStyle: 'italic', fontWeight: 500 }}>Live Session #{index + 1}</div>
            </div>
            <button
                onClick={(e) => toggleMute(index, e)}
                style={{
                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                    width: '46px', height: '46px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer', zIndex: 10
                }}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </motion.div>
    );
};

export default function CircularReelsGallery() {
    const sectionRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);
    const [currentChunk, setCurrentChunk] = useState(CHUNK_1);
    const [mutedStates, setMutedStates] = useState([true, true, true, true]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const smoothScroll = useSpring(scrollYProgress, { stiffness: 45, damping: 30, restDelta: 0.001 });
    const rotation = useTransform(smoothScroll, [0, 1], [0, 360]);
    const itemRotation = useTransform(rotation, r => -r);

    useMotionValueEvent(rotation, "change", (latest) => {
        const cycle = Math.floor(latest / 360);
        if (cycle % 2 === 1 && currentChunk !== CHUNK_2) {
            setCurrentChunk(CHUNK_2);
        } else if (cycle % 2 === 0 && currentChunk !== CHUNK_1) {
            setCurrentChunk(CHUNK_1);
        }
    });

    const toggleMute = (i, e) => {
        e.stopPropagation();
        e.preventDefault();
        const newStates = [...mutedStates];
        newStates[i] = !newStates[i];
        setMutedStates(newStates);
    };

    const positions = [
        { top: '-15%', left: '-10%' },
        { top: '-15%', right: '-10%' },
        { bottom: '-15%', right: '-10%' },
        { bottom: '-15%', left: '-10%' },
    ];

    return (
        <section ref={sectionRef} className="circular-gallery section" style={{
            minHeight: isMobile ? '120vh' : '180vh', // Significant reduction 
            position: 'relative',
            background: 'var(--bg-deep)',
            zIndex: 30, 
            overflow: 'visible', 
            padding: '4vh 0' // Reduced vertical padding
        }}>
            {/* Ambient Background Glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '80vw', height: '80vw', background: 'radial-gradient(circle, rgba(234, 92, 10, 0.05), transparent 70%)',
                filter: 'blur(120px)', pointerEvents: 'none', zIndex: 1
            }}></div>

            {/* Header */}
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 20, marginBottom: isMobile ? '6rem' : '0', padding: '0 1.5rem' }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="label"
                    style={{ background: 'transparent', border: 'none', margin: '0 auto 1.5rem', justifyContent: 'center' }}
                >
                    <Sparkles size={16} className="text-violet" style={{ marginRight: '10px' }} />
                    <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.25em' }}>SUCCESS STORIES</span>
                </motion.div>
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    className="heading-lg"
                    style={{ fontWeight: 400, margin: '0' }}
                >
                    Revolving <span className="text-violet italic">Success.</span>
                </motion.h2>
            </div>

            {isMobile ? (
                <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '5rem', alignItems: 'center', position: 'relative', zIndex: 10 }}>
                    {currentChunk.map((src, i) => (
                        <MobileReelCard
                            key={`mobile-video-${i}`}
                            src={src}
                            index={i}
                            scrollYProgress={scrollYProgress}
                            isMuted={mutedStates[i]}
                            toggleMute={toggleMute}
                        />
                    ))}
                </div>
            ) : (
                <div className="circular-gallery__sticky" style={{
                    position: 'sticky', top: 0, height: '100vh',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible'
                }}>
                    {/* Logo */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        style={{ position: 'absolute', zIndex: 10 }}
                    >
                        <img src="/Yovoai-logo-removebg-preview.png" alt="Yovo AI" style={{ height: '90px', filter: 'drop-shadow(0 0 35px rgba(234, 92, 10, 0.3))' }} />
                    </motion.div>

                    {/* Revolving Track - LARGE Size Restored */}
                    <motion.div style={{
                        position: 'relative',
                        width: 'clamp(600px, 110vmin, 1300px)',
                        height: 'clamp(600px, 110vmin, 1300px)',
                        borderRadius: '50%',
                        border: '1px solid rgba(254, 254, 254, 0.02)',
                        rotate: rotation
                    }}>
                        {/* Inner Decorative Ring */}
                        <div style={{ position: 'absolute', inset: '10%', border: '1px dashed rgba(255,255,255,0.04)', borderRadius: '50%' }}></div>

                        {currentChunk.map((src, i) => {
                            return (
                                <motion.div
                                    key={`desktop-video-${i}-${currentChunk === CHUNK_1 ? 1 : 2}`}
                                    whileHover={{ scale: 1.08 }}
                                    style={{
                                        position: 'absolute',
                                        ...positions[i],
                                        rotate: itemRotation,
                                        width: 'clamp(145px, 17vw, 195px)',
                                        aspectRatio: '9/16',
                                        borderRadius: '24px',
                                        overflow: 'hidden',
                                        boxShadow: '0 30px 60px rgba(0,0,0,0.8)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        background: '#050505',
                                        transformOrigin: 'center center',
                                        transition: 'all 0.4s var(--ease)'
                                    }}
                                >
                                    <video src={src} muted={mutedStates[i]} autoPlay loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' }}></div>
                                    <button
                                        onClick={(e) => toggleMute(i, e)}
                                        style={{
                                            position: 'absolute', top: '0.85rem', right: '0.85rem',
                                            width: '36px', height: '36px', borderRadius: '50%',
                                            background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#fff', cursor: 'pointer', zIndex: 10
                                        }}
                                    >
                                        {mutedStates[i] ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            )}
        </section>
    );
}
