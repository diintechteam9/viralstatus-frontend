import React, { useEffect, useState } from 'react';
import './Preloader.css';

const Preloader = ({ onComplete }) => {
    const [complete, setComplete] = useState(false);
    const [fadeStatus, setFadeStatus] = useState('entering');

    useEffect(() => {
        // Trigger fade out
        const fadeTimer = setTimeout(() => {
            setFadeStatus('exiting');
        }, 2800);

        // Completely unmount
        const endTimer = setTimeout(() => {
            setComplete(true);
            if (onComplete) onComplete();
        }, 3400);

        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(endTimer);
        };
    }, [onComplete]);

    if (complete) return null;

    return (
        <div className={`preloader-container ${fadeStatus}`}>
            <div className="preloader-content">
                <div className="preloader-logo-wrapper">
                    {/* Shadow / Base layer - Very Dim */}
                    <img src="/Yovoai-logo-removebg-preview.png" alt="Yovo AI Background" className="logo-bw" />

                    {/* Top-to-Bottom reveals original color image */}
                    <div className="color-reveal-container">
                        <img src="/Yovoai-logo-removebg-preview.png" alt="Yovo AI Loaded" className="logo-color" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Preloader;
