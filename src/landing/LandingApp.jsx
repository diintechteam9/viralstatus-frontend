import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import FloatingParticles from './components/FloatingParticles'
import Home from './pages/Home'
import About from './pages/About'
import Features from './pages/Features'
import ForBrands from './pages/ForBrands'
import ForCreators from './pages/ForCreators'
import Contact from './pages/Contact'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Preloader from './components/Preloader'
import './landing.css'

gsap.registerPlugin(ScrollTrigger)

const pageMap = {
    '/landingpage':              Home,
    '/landingpage/about':        About,
    '/landingpage/features':     Features,
    '/landingpage/for-brands':   ForBrands,
    '/landingpage/for-creators': ForCreators,
    '/landingpage/contact':      Contact,
    '/landingpage/privacy':      PrivacyPolicy,
}

function SmoothScrollWrapper({ children }) {
    const location = useLocation()

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
            smoothTouch: false,
        })

        const onScroll = () => ScrollTrigger.update()
        const onTick = (time) => lenis.raf(time * 1000)

        lenis.on('scroll', onScroll)
        gsap.ticker.add(onTick)
        gsap.ticker.lagSmoothing(0)
        window.lenis = lenis

        return () => {
            lenis.destroy()
            gsap.ticker.remove(onTick)
            delete window.lenis
        }
    }, [])

    useEffect(() => {
        window.scrollTo(0, 0)
        const timer = setTimeout(() => ScrollTrigger.refresh(), 100)
        return () => clearTimeout(timer)
    }, [location.pathname])

    return children
}

export default function LandingApp() {
    const [isLoading, setIsLoading] = useState(true)
    const location = useLocation()

    const PageComponent = pageMap[location.pathname] || Home

    return (
        <>
            {isLoading ? (
                <Preloader onComplete={() => setIsLoading(false)} />
            ) : (
                <SmoothScrollWrapper>
                    <div className="landing-scope">
                        <FloatingParticles />
                        <Navbar />
                        <PageComponent />
                        <Footer />
                    </div>
                </SmoothScrollWrapper>
            )}
        </>
    )
}
