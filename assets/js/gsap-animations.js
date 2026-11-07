/**
 * ====================================================================
 * PIXELCRAFT GSAP & SCROLLTRIGGER ANIMATION SYSTEM
 * Premium, production-grade animations for PixelCraft SaaS platform.
 *
 * Capabilities:
 * 1. Hero & page-load smooth entrance timeline
 * 2. ScrollTrigger-driven staggered section reveals
 * 3. Responsive card grids with progressive staggered flow
 * 4. Micro-interactions for buttons and interactive cards
 * 5. Full prefers-reduced-motion accessibility compliance
 * 6. Mobile & tablet performance optimization (hardware-accelerated)
 * 7. Dynamic content mutation support (auto-animates newly rendered tools)
 * 8. Zero interference with form submissions, clicks, and navigation
 * ====================================================================
 */

(function () {
    'use strict';

    const PixelCraftGSAP = {
        initialized: false,
        prefersReducedMotion: false,
        isMobile: false,
        scrollTriggers: [],

        /**
         * Initialize the animation engine
         */
        init() {
            if (this.initialized) return;

            // 1. Accessibility: Detect user motion preference
            this.checkMotionPreference();
            this.checkDeviceType();

            // 2. Ensure GSAP & ScrollTrigger are available
            this.loadAndBootstrap();
        },

        checkMotionPreference() {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.prefersReducedMotion = mediaQuery.matches;

            mediaQuery.addEventListener('change', (e) => {
                this.prefersReducedMotion = e.matches;
                if (this.prefersReducedMotion) {
                    this.disableAnimations();
                } else {
                    this.refresh();
                }
            });
        },

        checkDeviceType() {
            this.isMobile = window.innerWidth < 768;
            window.addEventListener('resize', this.debounce(() => {
                const nowMobile = window.innerWidth < 768;
                if (nowMobile !== this.isMobile) {
                    this.isMobile = nowMobile;
                    if (window.ScrollTrigger) {
                        window.ScrollTrigger.refresh();
                    }
                }
            }, 200), { passive: true });
        },

        debounce(func, wait) {
            let timeout;
            return function (...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * Load GSAP & ScrollTrigger scripts if not already in window
         */
        loadAndBootstrap() {
            if (window.gsap && window.ScrollTrigger) {
                this.bootstrap();
                return;
            }

            // Check if scripts are already tags in the DOM
            const hasGsapTag = !!document.querySelector('script[src*="gsap.min.js"]');
            if (!hasGsapTag) {
                this.injectScript('/assets/vendor/gsap/gsap.min.js', () => {
                    this.injectScript('/assets/vendor/gsap/ScrollTrigger.min.js', () => {
                        this.bootstrap();
                    });
                });
            } else {
                // Poll briefly until script tags execute
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    if (window.gsap && window.ScrollTrigger) {
                        clearInterval(interval);
                        this.bootstrap();
                    } else if (attempts > 30) {
                        clearInterval(interval);
                        // Fallback gracefully: reveal all elements via standard CSS
                        this.fallbackReveal();
                    }
                }, 50);
            }
        },

        injectScript(src, callback) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = callback;
            script.onerror = () => {
                console.warn(`[PixelCraft GSAP] Failed to load ${src}. Using standard transitions.`);
                this.fallbackReveal();
            };
            document.head.appendChild(script);
        },

        /**
         * Main bootstrap after GSAP & ScrollTrigger are verified
         */
        bootstrap() {
            if (!window.gsap) {
                this.fallbackReveal();
                return;
            }

            const gsap = window.gsap;
            const ScrollTrigger = window.ScrollTrigger;

            if (ScrollTrigger) {
                gsap.registerPlugin(ScrollTrigger);
                // Configure smooth ScrollTrigger defaults
                ScrollTrigger.config({
                    limitCallbacks: true,
                    ignoreMobileResize: true
                });
            }

            this.initialized = true;

            // If user prefers reduced motion, show everything cleanly without tweening
            if (this.prefersReducedMotion) {
                this.disableAnimations();
                return;
            }

            // Execute animation suites
            this.initNavbarAnimation();
            this.initHeroAnimation();
            this.initSectionHeaderAnimations();
            this.initCardGridScrollTriggers();
            this.initHighlightsAnimation();
            this.initPreFooterAnimation();
            this.initAmbientOrbs();
            this.initButtonMicroInteractions();
            this.initCardHoverEffects();
            this.observeDynamicContent();
        },

        /**
         * Fallback for reduced motion or script load failure
         */
        fallbackReveal() {
            document.querySelectorAll('.reveal-on-scroll').forEach(el => {
                el.classList.add('revealed');
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        },

        disableAnimations() {
            if (window.ScrollTrigger) {
                window.ScrollTrigger.getAll().forEach(st => st.kill());
            }
            this.fallbackReveal();
        },

        /**
         * 1. Top Navbar Entrance
         */
        initNavbarAnimation() {
            const header = document.querySelector('.site-header');
            if (!header) return;

            window.gsap.fromTo(header, 
                { y: -16, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity'
                }
            );
        },

        /**
         * 2. Hero Section Master Timeline
         */
        initHeroAnimation() {
            const hero = document.querySelector('.hero');
            if (!hero) return;

            const badge = hero.querySelector('.hero-badge-wrap, .hero-animate-badge');
            const title = hero.querySelector('.hero-title, .hero-animate-title');
            const subtitle = hero.querySelector('.hero-subtitle, .hero-animate-subtitle');
            const actions = hero.querySelector('.hero-actions, .hero-animate-actions');
            const actionButtons = actions ? actions.querySelectorAll('.btn') : [];

            const tl = window.gsap.timeline({
                defaults: { ease: 'power3.out' }
            });

            if (badge) {
                tl.fromTo(badge,
                    { y: 16, opacity: 0, scale: 0.94 },
                    { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'back.out(1.4)' }
                );
            }

            if (title) {
                tl.fromTo(title,
                    { y: 26, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7 },
                    '-=0.35'
                );
            }

            if (subtitle) {
                tl.fromTo(subtitle,
                    { y: 20, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.65 },
                    '-=0.45'
                );
            }

            if (actionButtons.length) {
                tl.fromTo(actionButtons,
                    { y: 18, opacity: 0, scale: 0.96 },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.5,
                        stagger: 0.1,
                        ease: 'back.out(1.2)',
                        clearProps: 'transform,opacity'
                    },
                    '-=0.35'
                );
            }
        },

        /**
         * 3. Ambient Glowing Background Orbs
         */
        initAmbientOrbs() {
            const orbs = document.querySelectorAll('.hero-glow-orb');
            if (!orbs.length) return;

            orbs.forEach((orb, index) => {
                const dirX = index % 2 === 0 ? 30 : -30;
                const dirY = index % 2 === 0 ? -25 : 25;
                const duration = 7 + index * 2;

                window.gsap.to(orb, {
                    x: dirX,
                    y: dirY,
                    scale: 1.08,
                    duration: duration,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                });
            });
        },

        /**
         * 4. Section Headers ScrollTrigger
         */
        initSectionHeaderAnimations() {
            if (!window.ScrollTrigger) return;

            const headers = document.querySelectorAll('.section-header, .page-header');
            headers.forEach(header => {
                const heading = header.querySelector('h1, h2, h3');
                const subtitle = header.querySelector('.section-subtitle, p');
                const elements = [heading, subtitle].filter(Boolean);

                if (!elements.length) return;

                window.gsap.fromTo(elements,
                    { y: this.isMobile ? 16 : 24, opacity: 0 },
                    {
                        y: 0,
                        opacity: 1,
                        duration: 0.65,
                        stagger: 0.12,
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: header,
                            start: 'top 86%',
                            once: true
                        },
                        onComplete: () => {
                            header.classList.add('revealed');
                            window.gsap.set(elements, { clearProps: 'transform' });
                        }
                    }
                );
            });
        },

        /**
         * 5. Staggered Card Grids with ScrollTrigger
         */
        initCardGridScrollTriggers() {
            if (!window.ScrollTrigger) return;

            // Target grid containers across all pages
            const gridSelectors = [
                'section:nth-of-type(2) div[style*="grid"]',
                '#home-featured-tools',
                '.tools-grid',
                '.template-grid',
                '#templates-grid',
                '.pricing-grid',
                '.workspace-grid',
                '.category-grid'
            ];

            const grids = document.querySelectorAll(gridSelectors.join(', '));
            grids.forEach(grid => {
                const cards = grid.querySelectorAll('.card, .card-interactive, .template-card, .pricing-card, .tool-card');
                if (!cards.length) return;

                window.gsap.fromTo(cards,
                    {
                        y: this.isMobile ? 18 : 32,
                        opacity: 0,
                        scale: this.isMobile ? 1 : 0.98
                    },
                    {
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        duration: 0.6,
                        stagger: {
                            amount: this.isMobile ? 0.28 : 0.45,
                            from: 'start'
                        },
                        ease: 'power2.out',
                        scrollTrigger: {
                            trigger: grid,
                            start: 'top 88%',
                            once: true
                        },
                        onComplete: () => {
                            cards.forEach(card => {
                                card.classList.add('revealed');
                                window.gsap.set(card, { clearProps: 'transform,opacity' });
                            });
                        }
                    }
                );
            });
        },

        /**
         * 6. SaaS Highlights & Trust Section
         */
        initHighlightsAnimation() {
            if (!window.ScrollTrigger) return;

            const trustCards = document.querySelectorAll('section:nth-of-type(4) .card, .trust-card');
            if (!trustCards.length) return;

            const parent = trustCards[0].parentElement;
            if (!parent) return;

            window.gsap.fromTo(trustCards,
                { y: this.isMobile ? 16 : 28, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.65,
                    stagger: 0.14,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: parent,
                        start: 'top 86%',
                        once: true
                    },
                    onComplete: () => {
                        trustCards.forEach(c => {
                            c.classList.add('revealed');
                            window.gsap.set(c, { clearProps: 'transform,opacity' });
                        });
                    }
                }
            );
        },

        /**
         * 7. Pre-Footer Banner Card ScrollTrigger
         */
        initPreFooterAnimation() {
            if (!window.ScrollTrigger) return;

            const ctaBanner = document.querySelector('.card-shimmer, .pre-footer-cta');
            if (!ctaBanner) return;

            window.gsap.fromTo(ctaBanner,
                { y: this.isMobile ? 18 : 30, opacity: 0, scale: 0.98 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.7,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: ctaBanner,
                        start: 'top 88%',
                        once: true
                    },
                    onComplete: () => {
                        ctaBanner.classList.add('revealed');
                        window.gsap.set(ctaBanner, { clearProps: 'transform,opacity' });
                    }
                }
            );
        },

        /**
         * 8. Micro-Interactions: Tactile Buttons
         */
        initButtonMicroInteractions() {
            // Apply lightweight GSAP magnetic/hover spring to primary/secondary buttons
            const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-shine');

            buttons.forEach(btn => {
                const icon = btn.querySelector('i');

                btn.addEventListener('mouseenter', () => {
                    if (this.prefersReducedMotion) return;
                    window.gsap.to(btn, {
                        scale: 1.02,
                        duration: 0.22,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                    if (icon) {
                        window.gsap.to(icon, {
                            x: 3,
                            duration: 0.2,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    }
                });

                btn.addEventListener('mouseleave', () => {
                    if (this.prefersReducedMotion) return;
                    window.gsap.to(btn, {
                        scale: 1,
                        duration: 0.22,
                        ease: 'power2.out',
                        overwrite: 'auto'
                    });
                    if (icon) {
                        window.gsap.to(icon, {
                            x: 0,
                            duration: 0.2,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    }
                });

                btn.addEventListener('mousedown', () => {
                    if (this.prefersReducedMotion) return;
                    window.gsap.to(btn, {
                        scale: 0.98,
                        duration: 0.1,
                        ease: 'power1.out'
                    });
                });

                btn.addEventListener('mouseup', () => {
                    if (this.prefersReducedMotion) return;
                    window.gsap.to(btn, {
                        scale: 1.02,
                        duration: 0.15,
                        ease: 'back.out(2)'
                    });
                });
            });
        },

        /**
         * 9. Elegant Card Hover Feedback
         */
        initCardHoverEffects() {
            if (this.isMobile || this.prefersReducedMotion) return;

            const interactiveCards = document.querySelectorAll('.card-interactive');
            interactiveCards.forEach(card => {
                const iconBox = card.querySelector('div[style*="width: 44px"], div[style*="width: 36px"]');

                card.addEventListener('mouseenter', () => {
                    if (iconBox) {
                        window.gsap.to(iconBox, {
                            scale: 1.1,
                            rotation: -4,
                            duration: 0.28,
                            ease: 'back.out(2)',
                            overwrite: 'auto'
                        });
                    }
                });

                card.addEventListener('mouseleave', () => {
                    if (iconBox) {
                        window.gsap.to(iconBox, {
                            scale: 1,
                            rotation: 0,
                            duration: 0.25,
                            ease: 'power2.out',
                            overwrite: 'auto'
                        });
                    }
                });
            });
        },

        /**
         * 10. Dynamic Content Observer (tools-engine & templates)
         * Automatically animates newly injected cards without extra code
         */
        observeDynamicContent() {
            const containers = document.querySelectorAll('#home-featured-tools, #tools-grid, #templates-grid, #workspace-projects-grid');
            if (!containers.length) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        const newCards = Array.from(mutation.addedNodes).filter(node => 
                            node.nodeType === 1 && (node.classList.contains('card') || node.classList.contains('card-interactive'))
                        );

                        if (newCards.length) {
                            this.animateNewCards(newCards);
                        }
                    }
                });
            });

            containers.forEach(container => {
                observer.observe(container, { childList: true });
            });
        },

        /**
         * Animate batch of newly rendered elements
         */
        animateNewCards(cards) {
            if (this.prefersReducedMotion || !window.gsap) {
                cards.forEach(c => {
                    c.classList.add('revealed');
                    c.style.opacity = '1';
                });
                return;
            }

            window.gsap.fromTo(cards,
                { y: 22, opacity: 0, scale: 0.98 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.55,
                    stagger: 0.08,
                    ease: 'power2.out',
                    clearProps: 'transform,opacity',
                    onComplete: () => {
                        cards.forEach(c => c.classList.add('revealed'));
                        this.initButtonMicroInteractions();
                    }
                }
            );

            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        },

        /**
         * Public API: Manual refresh (called after tool/template filter changes)
         */
        refresh() {
            if (window.ScrollTrigger) {
                window.ScrollTrigger.refresh();
            }
        }
    };

    // Expose to window
    window.PixelCraftGSAP = PixelCraftGSAP;

    // Self-initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => PixelCraftGSAP.init());
    } else {
        PixelCraftGSAP.init();
    }
})();
