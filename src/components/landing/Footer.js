'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from '@/lib/gsap';

export default function Footer() {
    const footerRef = useRef(null);
    const linksRef = useRef([]);
    const logoRef = useRef(null);

    useEffect(() => {
        const footer = footerRef.current;
        const links = linksRef.current;
        const logo = logoRef.current;

        if (!footer) return;

        // Set initial states
        gsap.set([logo, ...links], { opacity: 0, y: 20 });

        // Create scroll trigger animation
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: footer,
                start: 'top 90%',
                end: 'bottom 100%',
                toggleActions: 'play none none reverse'
            }
        });

        tl.to(logo, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out'
        })
            .to(links, {
                opacity: 1,
                y: 0,
                duration: 0.4,
                stagger: 0.1,
                ease: 'power2.out'
            }, '-=0.3');

        // Add hover animations for links
        links.forEach(link => {
            if (link) {
                const handleMouseEnter = () => {
                    gsap.to(link, {
                        scale: 1.05,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                };

                const handleMouseLeave = () => {
                    gsap.to(link, {
                        scale: 1,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                };

                link.addEventListener('mouseenter', handleMouseEnter);
                link.addEventListener('mouseleave', handleMouseLeave);

                return () => {
                    link.removeEventListener('mouseenter', handleMouseEnter);
                    link.removeEventListener('mouseleave', handleMouseLeave);
                };
            }
        });

        return () => {
            tl.kill();
        };
    }, []);

    const addToRefs = (el, index) => {
        if (el) linksRef.current[index] = el;
    };

    return (
        <footer
            id="footer"
            ref={footerRef}
            className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-12 sm:py-16"
            role="contentinfo"
            aria-label="Site footer"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 lg:gap-8">
                    {/* Company Info */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <div
                            ref={logoRef}
                            className="flex items-center space-x-3 mb-4 justify-center sm:justify-start"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-slate-900 dark:text-white">
                                Cloud Opti
                            </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md text-center sm:text-left text-sm sm:text-base">
                            Intelligent cloud architecture optimization that helps developers make cost-effective infrastructure decisions with confidence.
                        </p>
                        <div className="flex space-x-4 justify-center sm:justify-start">
                            <a
                                href="#"
                                ref={(el) => addToRefs(el, 0)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 -m-2"
                                aria-label="GitHub"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                ref={(el) => addToRefs(el, 1)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 -m-2"
                                aria-label="Twitter"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                ref={(el) => addToRefs(el, 2)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-2 -m-2"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="text-center sm:text-left">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Product
                        </h3>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <Link
                                    href="/analyze"
                                    ref={(el) => addToRefs(el, 3)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    GitHub Analysis
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/estimate"
                                    ref={(el) => addToRefs(el, 4)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Cost Estimation
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/results"
                                    ref={(el) => addToRefs(el, 5)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    <span className="hidden sm:inline">Architecture Recommendations</span>
                                    <span className="sm:hidden">Recommendations</span>
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 6)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    <span className="hidden sm:inline">API Documentation</span>
                                    <span className="sm:hidden">API Docs</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="text-center sm:text-left">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                            Company
                        </h3>
                        <ul className="space-y-2 sm:space-y-3">
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 7)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 8)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 9)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 10)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Contact
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 11)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    ref={(el) => addToRefs(el, 12)}
                                    className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm sm:text-base py-1 px-2 -mx-2 rounded block"
                                >
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                            © 2025 Cloud Opti. All rights reserved.
                        </p>
                        <div className="flex items-center space-x-6 mt-3 sm:mt-0">
                            <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
                                Made with ❤️ for developers
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}