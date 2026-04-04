import { useEffect, useRef } from 'react'

export default function FloatingParticles() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        let animationId
        let particles = []
        let mouseX = -1000
        let mouseY = -1000

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const onMouse = (e) => {
            mouseX = e.clientX
            mouseY = e.clientY
        }
        window.addEventListener('mousemove', onMouse, { passive: true })

        class Particle {
            constructor() {
                this.reset()
            }
            reset() {
                this.x = Math.random() * canvas.width
                this.y = Math.random() * canvas.height
                this.size = Math.random() * 1.5 + 0.3
                this.speedX = (Math.random() - 0.5) * 0.2
                this.speedY = (Math.random() - 0.5) * 0.2
                this.baseOpacity = Math.random() * 0.08 + 0.02
                this.opacity = this.baseOpacity
                // Premium color palette: violet, pink, cyan
                const palette = [
                    { h: 264, s: 80, l: 70 }, // violet
                    { h: 330, s: 75, l: 65 }, // pink
                    { h: 190, s: 80, l: 60 }, // cyan
                    { h: 280, s: 70, l: 60 }, // purple
                ]
                const c = palette[Math.floor(Math.random() * palette.length)]
                this.hue = c.h
                this.sat = c.s
                this.light = c.l
                this.pulseSpeed = Math.random() * 0.002 + 0.001
                this.pulsePhase = Math.random() * Math.PI * 2
            }
            update(t) {
                this.x += this.speedX
                this.y += this.speedY

                // Subtle mouse repulsion
                const dx = this.x - mouseX
                const dy = this.y - mouseY
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 150) {
                    const force = (150 - dist) / 150 * 0.3
                    this.x += (dx / dist) * force
                    this.y += (dy / dist) * force
                }

                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1

                // Pulse
                this.opacity = this.baseOpacity + Math.sin(t * this.pulseSpeed + this.pulsePhase) * 0.02
            }
            draw() {
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.opacity})`
                ctx.fill()

                // Subtle glow
                if (this.size > 1) {
                    ctx.beginPath()
                    ctx.arc(this.x, this.y, this.size * 4, 0, Math.PI * 2)
                    ctx.fillStyle = `hsla(${this.hue}, ${this.sat}%, ${this.light}%, ${this.opacity * 0.15})`
                    ctx.fill()
                }
            }
        }

        // Connection lines between nearby particles
        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 120) {
                        const opacity = (1 - dist / 120) * 0.04
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(167, 139, 250, ${opacity})`
                        ctx.lineWidth = 0.5
                        ctx.stroke()
                    }
                }
            }
        }

        const count = Math.min(35, Math.floor(window.innerWidth / 40))
        for (let i = 0; i < count; i++) {
            particles.push(new Particle())
        }

        let t = 0
        const animate = () => {
            t++
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            particles.forEach((p) => {
                p.update(t)
                p.draw()
            })
            drawConnections()
            animationId = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', onMouse)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                opacity: 0.7,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 0,
            }}
        />
    )
}
