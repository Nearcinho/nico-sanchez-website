/**
 * ============================================================================
 * NICOLÁS SÁNCHEZ - WEBSITE INTERACTIVITY
 * ============================================================================
 *
 * JavaScript modular y ligero para:
 * - Navegación móvil
 * - Animaciones de scroll (Intersection Observer)
 * - Navegación suave
 * - Efectos visuales sutiles
 *
 * Sin dependencias externas para máxima performance.
 */

(function() {
    'use strict';

    // ========================================================================
    // DOM ELEMENTS
    // ========================================================================

    const DOM = {
        nav: document.getElementById('nav'),
        navToggle: document.getElementById('nav-toggle'),
        navMenu: document.getElementById('nav-menu'),
        navLinks: document.querySelectorAll('.nav-link'),
        fadeElements: document.querySelectorAll('.fade-in'),
        sections: document.querySelectorAll('.section'),
        cards: document.querySelectorAll('.expertise-card, .testimonial-card, .timeline-item, .philosophy-item')
    };

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    /**
     * Maneja el estado del menú móvil
     */
    function initMobileNav() {
        if (!DOM.navToggle || !DOM.navMenu) return;

        DOM.navToggle.addEventListener('click', toggleMenu);

        // Cerrar menú al hacer click en un enlace
        DOM.navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.contains(e.target) && !DOM.navToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenu();
            }
        });
    }

    function toggleMenu() {
        DOM.navToggle.classList.toggle('active');
        DOM.navMenu.classList.toggle('active');
        document.body.style.overflow = DOM.navMenu.classList.contains('active') ? 'hidden' : '';
    }

    function closeMenu() {
        DOM.navToggle.classList.remove('active');
        DOM.navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }

    /**
     * Añade clase al nav cuando se hace scroll
     */
    function initNavScroll() {
        if (!DOM.nav) return;

        let lastScroll = 0;
        const scrollThreshold = 50;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // Añadir/quitar clase de scroll
            if (currentScroll > scrollThreshold) {
                DOM.nav.classList.add('scrolled');
            } else {
                DOM.nav.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ========================================================================
    // SCROLL ANIMATIONS (Intersection Observer)
    // ========================================================================

    /**
     * Inicializa animaciones de aparición con Intersection Observer
     * Más eficiente que escuchar eventos de scroll
     */
    function initScrollAnimations() {
        // Verificar soporte para Intersection Observer
        if (!('IntersectionObserver' in window)) {
            // Fallback: mostrar todos los elementos
            DOM.fadeElements.forEach(el => el.classList.add('visible'));
            DOM.cards.forEach(el => el.classList.add('visible'));
            return;
        }

        // Observer para elementos fade-in
        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Dejar de observar una vez visible
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        DOM.fadeElements.forEach(el => fadeObserver.observe(el));

        // Observer para cards y elementos de sección
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    // Añadir delay escalonado para efecto cascada
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 100);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        // Preparar cards para animación
        DOM.cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            cardObserver.observe(card);
        });
    }

    // ========================================================================
    // SMOOTH SCROLL
    // ========================================================================

    /**
     * Navegación suave hacia secciones (mejora la nativa de CSS)
     */
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');

                // Ignorar enlaces vacíos o solo #
                if (!href || href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                // Calcular posición considerando el nav fijo
                const navHeight = DOM.nav ? DOM.nav.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                // Actualizar URL sin scroll
                history.pushState(null, null, href);
            });
        });
    }

    // ========================================================================
    // ACTIVE NAV LINK HIGHLIGHTING
    // ========================================================================

    /**
     * Resalta el enlace de navegación de la sección activa
     */
    function initActiveNavHighlight() {
        if (!DOM.sections.length) return;

        const navHeight = DOM.nav ? DOM.nav.offsetHeight : 0;

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (!id) return;

                    // Remover clase activa de todos los enlaces
                    DOM.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: `-${navHeight}px 0px -50% 0px`
        });

        DOM.sections.forEach(section => {
            if (section.getAttribute('id')) {
                sectionObserver.observe(section);
            }
        });
    }

    // ========================================================================
    // PERFORMANCE OPTIMIZATIONS
    // ========================================================================

    /**
     * Debounce function para optimizar eventos frecuentes
     */
    function debounce(func, wait = 10) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Prefetch de enlaces internos en hover para mejor performance
     */
    function initLinkPrefetch() {
        // Solo en navegadores que soporten prefetch
        if (!('IntersectionObserver' in window)) return;

        const prefetchedUrls = new Set();

        document.querySelectorAll('a[href^="http"]').forEach(link => {
            link.addEventListener('mouseenter', () => {
                const href = link.getAttribute('href');
                if (prefetchedUrls.has(href)) return;

                const prefetchLink = document.createElement('link');
                prefetchLink.rel = 'prefetch';
                prefetchLink.href = href;
                document.head.appendChild(prefetchLink);
                prefetchedUrls.add(href);
            }, { once: true });
        });
    }

    // ========================================================================
    // ACCESSIBILITY ENHANCEMENTS
    // ========================================================================

    /**
     * Mejoras de accesibilidad
     */
    function initAccessibility() {
        // Detectar uso de teclado para mostrar focus rings
        let isKeyboardUser = false;

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                isKeyboardUser = true;
                document.body.classList.add('keyboard-user');
            }
        });

        document.addEventListener('mousedown', () => {
            isKeyboardUser = false;
            document.body.classList.remove('keyboard-user');
        });

        // Skip to content link (si existe)
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                }
            });
        }
    }

    // ========================================================================
    // EASTER EGG (Console message para devs)
    // ========================================================================

    function initConsoleMessage() {
        console.log('%c¡Hola! 👋', 'font-size: 24px; font-weight: bold; color: #0066FF;');
        console.log('%cSi estás viendo esto, probablemente te interesa el código.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Este sitio está construido con HTML, CSS y JavaScript puro.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Sin frameworks, sin dependencias innecesarias.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Performance y simplicidad por sobre todo.', 'font-size: 14px; color: #6B7280;');
        console.log('%c¿Conectamos? → linkedin.com/in/nicosanchez', 'font-size: 14px; color: #0066FF;');
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    /**
     * Inicializa todas las funcionalidades cuando el DOM está listo
     */
    function init() {
        initMobileNav();
        initNavScroll();
        initScrollAnimations();
        initSmoothScroll();
        initActiveNavHighlight();
        initAccessibility();
        initLinkPrefetch();
        initConsoleMessage();

        // Marcar como cargado para transiciones CSS
        document.body.classList.add('loaded');
    }

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================================================
    // EXPORT (para uso modular si es necesario)
    // ========================================================================

    window.NicoSanchez = {
        init,
        closeMenu,
        debounce
    };

})();
