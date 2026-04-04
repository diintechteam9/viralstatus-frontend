import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const variants = {
    fadeUp: {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0 }
    },
    fadeDown: {
        hidden: { opacity: 0, y: -60 },
        visible: { opacity: 1, y: 0 }
    },
    fadeLeft: {
        hidden: { opacity: 0, x: -80 },
        visible: { opacity: 1, x: 0 }
    },
    fadeRight: {
        hidden: { opacity: 0, x: 80 },
        visible: { opacity: 1, x: 0 }
    },
    scaleUp: {
        hidden: { opacity: 0, scale: 0.7 },
        visible: { opacity: 1, scale: 1 }
    },
    scaleDown: {
        hidden: { opacity: 0, scale: 1.3 },
        visible: { opacity: 1, scale: 1 }
    },
    rotateIn: {
        hidden: { opacity: 0, rotate: -15, scale: 0.8 },
        visible: { opacity: 1, rotate: 0, scale: 1 }
    },
    flipX: {
        hidden: { opacity: 0, rotateX: 90 },
        visible: { opacity: 1, rotateX: 0 }
    },
    flipY: {
        hidden: { opacity: 0, rotateY: 90 },
        visible: { opacity: 1, rotateY: 0 }
    },
    blur: {
        hidden: { opacity: 0, filter: 'blur(10px)' },
        visible: { opacity: 1, filter: 'blur(0px)' }
    },
    slideRotate: {
        hidden: { opacity: 0, x: -100, rotate: -10 },
        visible: { opacity: 1, x: 0, rotate: 0 }
    },
    bounce: {
        hidden: { opacity: 0, y: 100, scale: 0.5 },
        visible: { opacity: 1, y: 0, scale: 1 }
    },
    elastic: {
        hidden: { opacity: 0, scale: 0, rotate: -180 },
        visible: { opacity: 1, scale: 1, rotate: 0 }
    },
    glitch: {
        hidden: { opacity: 0, x: -20, skewX: 20 },
        visible: { opacity: 1, x: 0, skewX: 0 }
    }
}

export default function SectionReveal({ 
    children, 
    className = '', 
    delay = 0, 
    variant = 'fadeUp',
    duration = 0.8,
    once = true 
}) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once, margin: '-80px' })

    const selectedVariant = variants[variant] || variants.fadeUp

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={selectedVariant}
            transition={{
                duration,
                delay,
                ease: variant === 'bounce' ? [0.68, -0.55, 0.265, 1.55] :
                      variant === 'elastic' ? [0.175, 0.885, 0.32, 1.275] :
                      [0.22, 1, 0.36, 1]
            }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
