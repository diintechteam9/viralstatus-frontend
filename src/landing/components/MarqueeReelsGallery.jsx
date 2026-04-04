import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, ArrowUpRight } from 'lucide-react';

import reel1 from '../assets/reelVideo/reel1.mp4';
import reel2 from '../assets/reelVideo/reel2.mp4';
import reel3 from '../assets/reelVideo/reel3.mp4';
import reel4 from '../assets/reelVideo/reel4.mp4';
import reel5 from '../assets/reelVideo/reel5.mp4';
import reel6 from '../assets/reelVideo/reel6.mp4';
import reel7 from '../assets/reelVideo/reel7.mp4';
import reel8 from '../assets/reelVideo/reel8.mp4';

const REELS = [
    { src: reel1, title: 'Food Ball' },
    { src: reel2, title: 'Mukbang Vlog' },
    { src: reel3, title: 'Studio Commentary' },
    { src: reel4, title: 'Brand Pop-Up' },
    { src: reel5, title: 'Yarn Animation' },
    { src: reel6, title: 'Peach Travel' },
    { src: reel7, title: 'Custom IP' },
    { src: reel8, title: 'Creator Life' }
];

export default function MarqueeReelsGallery() {
    // Duplicate array for seamless infinite scrolling
    const marqueeItems = [...REELS, ...REELS];
    const [mutedStates, setMutedStates] = useState(Array(marqueeItems.length).fill(true));

    const toggleMute = (i, e) => {
        e.stopPropagation();
        e.preventDefault();
        const newStates = [...mutedStates];
        newStates[i] = !newStates[i];
        setMutedStates(newStates);
    };

    return (
        <section className="marquee-gallery section" style={{ padding: '8rem 0', background: 'var(--bg-deep)', overflow: 'hidden' }}>
            <div className="container" style={{ marginBottom: '4rem', paddingLeft: '2rem' }}>
                <div className="label" style={{ background: 'transparent', padding: 0, border: 'none', marginBottom: '1rem', justifyContent: 'flex-start' }}>
                    <span className="label__dot"></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Visual Experience</span>
                </div>
                <h2 className="heading-lg" style={{ marginBottom: '2rem', fontWeight: 400 }}>
                    Real Connection,<br />
                    <span className="text-violet">Reel Growth.</span>
                </h2>
                <a
                    href="https://play.google.com/store/apps/details?id=com.diin.yovoai"
                    target="_blank"
                    rel="noreferrer"
                    className="home-btn home-btn--primary"
                    style={{
                        display: 'inline-flex',
                        width: 'max-content',
                        padding: '1rem 2.5rem',
                        borderRadius: '40px',
                        fontSize: '1.2rem',
                        fontWeight: '600'
                    }}
                >
                    Start for Free <ArrowUpRight size={22} style={{ marginLeft: '0.5rem' }} />
                </a>
            </div>

            <div style={{ position: 'relative', width: '100vw', overflow: 'hidden' }}>
                <div
                    className="marquee-container"
                    style={{
                        position: 'relative',
                        display: 'flex',
                        width: 'max-content',
                        padding: '1rem 0',
                    }}
                >
                    {marqueeItems.map((item, i) => (
                        <div
                            key={`marquee-item-${i}`}
                            style={{
                                position: 'relative',
                                width: 'clamp(240px, 22vw, 320px)',
                                aspectRatio: '9/16',
                                flexShrink: 0,
                                marginRight: '1.5rem',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                backgroundColor: '#111',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                transform: 'translateZ(0)', // Force GPU acceleration
                            }}
                        >
                            <video
                                src={item.src}
                                autoPlay
                                loop
                                muted={mutedStates[i]}
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />

                            {/* "New" Badge Top Left */}
                            <div style={{
                                position: 'absolute',
                                top: '1.25rem',
                                left: '1.25rem',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                border: '1px solid rgba(255,255,255,0.3)',
                                color: '#fff',
                                zIndex: 10
                            }}>
                                <Sparkles size={14} /> New
                            </div>

                            {/* Speaker Toggle Button Top Right */}
                            <button
                                onClick={(e) => toggleMute(i, e)}
                                style={{
                                    position: 'absolute', top: '1.25rem', right: '1.25rem',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', cursor: 'pointer', zIndex: 10,
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234, 92, 10, 0.9)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.5)' }}
                            >
                                {mutedStates[i] ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            {/* Bottom Gradient Overlay for Text Readability */}
                            <div style={{
                                position: 'absolute',
                                bottom: 0, left: 0, right: 0,
                                height: '50%',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 100%)',
                                pointerEvents: 'none',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                paddingBottom: '2.5rem'
                            }}>
                                <h3 style={{
                                    color: '#fff',
                                    fontFamily: '"Inter", "SF Pro Display", sans-serif',
                                    fontWeight: '800',
                                    fontSize: '1.4rem',
                                    textAlign: 'center',
                                    letterSpacing: '-0.03em',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                                }}>
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Injected Keyframes for CSS Animation */}
            <style>{`
                @keyframes marqueeScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .marquee-container {
                    animation: marqueeScroll 35s linear infinite;
                }
                .marquee-container:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </section>
    );
}
