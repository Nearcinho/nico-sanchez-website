/**
 * ============================================================================
 * NICOLÁS SÁNCHEZ - WEBSITE INTERACTIVITY
 * Versión Premium 2025
 * ============================================================================
 *
 * Módulos:
 * - Navegación: Menú móvil, scroll effects, active states
 * - Servicios: Acordeón con carrusel sincronizado
 * - Testimonios: Carrusel táctil con navegación
 * - Animaciones: IntersectionObserver, scroll reveals
 * - Accesibilidad: ARIA, keyboard navigation, reduced motion
 */

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURACIÓN GLOBAL
    // =========================================================================
    
    const CONFIG = {
        animation: {
            duration: 800,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        },
        carousel: {
            autoplayDelay: 4000,
            transitionDuration: 500
        }
    };

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    const utils = {
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        prefersReducedMotion: () => {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
    };

    // =========================================================================
    // NAVEGACIÓN
    // =========================================================================

    const Navigation = {
        nav: null,
        toggle: null,
        menu: null,
        links: null,

        init() {
            this.nav = document.getElementById('nav');
            this.toggle = document.getElementById('nav-toggle');
            this.menu = document.getElementById('nav-menu');
            this.links = this.menu?.querySelectorAll('.nav-link');

            if (!this.toggle || !this.menu) return;

            this.bindEvents();
            this.initScrollEffect();
            this.initActiveState();
        },

        bindEvents() {
            // Toggle menu
            this.toggle.addEventListener('click', () => this.toggleMenu());

            // Cerrar al hacer click en links
            this.links.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });

            // Cerrar al hacer click fuera
            document.addEventListener('click', (e) => {
                if (!this.menu.contains(e.target) && !this.toggle.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Cerrar con Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
        },

        toggleMenu() {
            const isOpen = this.toggle.classList.toggle('active');
            this.menu.classList.toggle('active', isOpen);
            this.toggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        },

        closeMenu() {
            this.toggle.classList.remove('active');
            this.menu.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        },

        initScrollEffect() {
            if (!this.nav) return;

            const handleScroll = utils.throttle(() => {
                const scrolled = window.pageYOffset > 50;
                this.nav.classList.toggle('nav--scrolled', scrolled);
            }, 100);

            window.addEventListener('scroll', handleScroll, { passive: true });
        },

        initActiveState() {
            const sections = document.querySelectorAll('section[id]');
            if (!sections.length || !this.links) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        this.links.forEach(link => {
                            link.classList.toggle('active', 
                                link.getAttribute('href') === `#${id}`
                            );
                        });
                    }
                });
            }, {
                threshold: 0.3,
                rootMargin: `-${this.nav?.offsetHeight || 80}px 0px -50% 0px`
            });

            sections.forEach(section => observer.observe(section));
        }
    };

    // =========================================================================
    // SERVICIOS - Acordeón con Carrusel
    // =========================================================================

    const Services = {
        items: null,
        carousel: null,
        currentImages: [],
        currentIndex: 0,
        autoplayInterval: null,

        init() {
            this.items = document.querySelectorAll('.service-item');
            this.carousel = document.getElementById('services-carousel');
            
            if (!this.items.length) return;

            this.initAccordion();
            this.initCarousel();
            
            // Activar primer item por defecto
            this.activateItem(this.items[0]);
        },

        initAccordion() {
            this.items.forEach(item => {
                const header = item.querySelector('.service-item__header');
                
                header.addEventListener('click', () => this.activateItem(item));
                
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.activateItem(item);
                    }
                });
            });
        },

        activateItem(item) {
            // Desactivar todos
            this.items.forEach(i => {
                i.classList.remove('active');
                i.querySelector('.service-item__header').setAttribute('aria-expanded', 'false');
            });

            // Activar el seleccionado
            item.classList.add('active');
            item.querySelector('.service-item__header').setAttribute('aria-expanded', 'true');

            // Actualizar imágenes del carrusel
            const imagesData = item.getAttribute('data-images');
            if (imagesData) {
                this.currentImages = JSON.parse(imagesData);
                this.rebuildCarousel();
            }
        },

        initCarousel() {
            if (!this.carousel) return;

            // Botones de navegación
            const prevBtn = this.carousel.querySelector('.carousel__btn--prev');
            const nextBtn = this.carousel.querySelector('.carousel__btn--next');

            prevBtn?.addEventListener('click', () => this.prevSlide());
            nextBtn?.addEventListener('click', () => this.nextSlide());

            // Touch/Swipe
            let touchStartX = 0;
            let touchEndX = 0;

            this.carousel.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.carousel.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });

            // Pausar autoplay en hover
            this.carousel.addEventListener('mouseenter', () => this.stopAutoplay());
            this.carousel.addEventListener('mouseleave', () => this.startAutoplay());
        },

        rebuildCarousel() {
            const track = document.getElementById('carousel-track');
            const progress = document.getElementById('carousel-progress');
            
            if (!track || !this.currentImages.length) return;

            // Limpiar
            track.innerHTML = '';
            progress.innerHTML = '';
            this.currentIndex = 0;

            // Crear slides
            this.currentImages.forEach((src, index) => {
                const slide = document.createElement('div');
                slide.className = 'carousel__slide';
                slide.innerHTML = `
                    <img src="${src}" alt="Actividad ${index + 1}" class="carousel__image" loading="${index === 0 ? 'eager' : 'lazy'}">
                `;
                track.appendChild(slide);

                // Crear dot
                const dot = document.createElement('button');
                dot.className = `carousel__progress-dot ${index === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Ver imagen ${index + 1}`);
                dot.addEventListener('click', () => this.goToSlide(index));
                progress.appendChild(dot);
            });

            this.updateCarouselPosition();
            this.startAutoplay();
        },

        updateCarouselPosition() {
            const track = document.getElementById('carousel-track');
            const dots = document.querySelectorAll('.carousel__progress-dot');
            
            if (!track) return;

            track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
            
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentIndex);
            });
        },

        nextSlide() {
            this.currentIndex = (this.currentIndex + 1) % this.currentImages.length;
            this.updateCarouselPosition();
            this.resetAutoplay();
        },

        prevSlide() {
            this.currentIndex = (this.currentIndex - 1 + this.currentImages.length) % this.currentImages.length;
            this.updateCarouselPosition();
            this.resetAutoplay();
        },

        goToSlide(index) {
            this.currentIndex = index;
            this.updateCarouselPosition();
            this.resetAutoplay();
        },

        handleSwipe(startX, endX) {
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.nextSlide();
                else this.prevSlide();
            }
        },

        startAutoplay() {
            if (utils.prefersReducedMotion()) return;
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => this.nextSlide(), CONFIG.carousel.autoplayDelay);
        },

        stopAutoplay() {
            if (this.autoplayInterval) {
                clearInterval(this.autoplayInterval);
                this.autoplayInterval = null;
            }
        },

        resetAutoplay() {
            this.stopAutoplay();
            this.startAutoplay();
        }
    };

    // =========================================================================
    // TESTIMONIOS - Carrusel
    // =========================================================================

    const Testimonials = {
        track: null,
        items: null,
        prevBtn: null,
        nextBtn: null,
        dots: null,
        currentIndex: 0,
        itemWidth: 0,
        gap: 24,

        init() {
            this.track = document.getElementById('testimonials-track');
            if (!this.track) return;

            this.items = this.track.querySelectorAll('.testimonial-card-new');
            this.prevBtn = document.querySelector('.testimonials-nav__btn--prev');
            this.nextBtn = document.querySelector('.testimonials-nav__btn--next');
            this.dots = document.querySelectorAll('.testimonials-nav__dot');

            this.bindEvents();
            this.calculateDimensions();
            this.updatePosition();

            window.addEventListener('resize', utils.debounce(() => {
                this.calculateDimensions();
                this.updatePosition();
            }, 250));
        },

        bindEvents() {
            this.prevBtn?.addEventListener('click', () => this.prev());
            this.nextBtn?.addEventListener('click', () => this.next());

            this.dots.forEach((dot, index) => {
                dot.addEventListener('click', () => this.goTo(index));
            });

            // Touch/Swipe
            let touchStartX = 0;
            let touchEndX = 0;

            this.track.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            this.track.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe(touchStartX, touchEndX);
            }, { passive: true });
        },

        calculateDimensions() {
            if (!this.items.length) return;
            
            const containerWidth = this.track.parentElement.offsetWidth;
            
            // Calcular cuántos items mostrar según el viewport
            if (window.innerWidth >= 1024) {
                this.itemWidth = (containerWidth - this.gap * 2) / 3;
            } else if (window.innerWidth >= 768) {
                this.itemWidth = (containerWidth - this.gap) / 2;
            } else {
                this.itemWidth = containerWidth;
            }
        },

        updatePosition() {
            if (!this.track) return;
            
            const offset = this.currentIndex * (this.itemWidth + this.gap);
            this.track.style.transform = `translateX(-${offset}px)`;

            // Actualizar dots
            this.dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === this.currentIndex);
                dot.setAttribute('aria-selected', index === this.currentIndex);
            });
        },

        next() {
            const maxIndex = this.items.length - 1;
            this.currentIndex = Math.min(this.currentIndex + 1, maxIndex);
            this.updatePosition();
        },

        prev() {
            this.currentIndex = Math.max(this.currentIndex - 1, 0);
            this.updatePosition();
        },

        goTo(index) {
            this.currentIndex = index;
            this.updatePosition();
        },

        handleSwipe(startX, endX) {
            const diff = startX - endX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) this.next();
                else this.prev();
            }
        }
    };

    // =========================================================================
    // ANIMACIONES DE SCROLL
    // =========================================================================

    const Animations = {
        init() {
            this.initFadeIn();
            this.initSlideIn();
        },

        initFadeIn() {
            const elements = document.querySelectorAll('.fade-in');
            if (!elements.length || utils.prefersReducedMotion()) {
                elements.forEach(el => el.classList.add('visible'));
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const delay = entry.target.dataset.delay || 0;
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, delay * 100);
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: CONFIG.animation.threshold,
                rootMargin: CONFIG.animation.rootMargin
            });

            elements.forEach(el => observer.observe(el));
        },

        initSlideIn() {
            const elements = document.querySelectorAll('.slide-in-left, .slide-in-right');
            if (!elements.length || utils.prefersReducedMotion()) {
                elements.forEach(el => el.classList.add('visible'));
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: CONFIG.animation.threshold,
                rootMargin: CONFIG.animation.rootMargin
            });

            elements.forEach(el => observer.observe(el));
        }
    };

    // =========================================================================
    // SMOOTH SCROLL
    // =========================================================================

    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => this.handleClick(e, anchor));
            });
        },

        handleClick(e, anchor) {
            const href = anchor.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const navHeight = document.getElementById('nav')?.offsetHeight || 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: utils.prefersReducedMotion() ? 'auto' : 'smooth'
            });

            // Actualizar URL sin saltar
            history.pushState(null, null, href);
        }
    };

    // =========================================================================
    // ACCESIBILIDAD
    // =========================================================================

    const Accessibility = {
        init() {
            this.initKeyboardNavigation();
            this.initFocusManagement();
        },

        initKeyboardNavigation() {
            // Detectar si el usuario usa teclado
            let isKeyboard = false;

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    isKeyboard = true;
                    document.body.classList.add('keyboard-user');
                }
            });

            document.addEventListener('mousedown', () => {
                isKeyboard = false;
                document.body.classList.remove('keyboard-user');
            });
        },

        initFocusManagement() {
            // Asegurar que los elementos interactivos sean focusables
            document.querySelectorAll('[role="button"]').forEach(el => {
                if (!el.hasAttribute('tabindex')) {
                    el.setAttribute('tabindex', '0');
                }
            });
        }
    };

    // =========================================================================
    // CONSOLA - Easter Egg
    // =========================================================================

    const ConsoleMessage = {
        init() {
            const styles = [
                'font-size: 24px',
                'font-weight: bold',
                'color: #0066FF',
                'text-shadow: 2px 2px 4px rgba(0,102,255,0.3)'
            ].join(';');

            console.log('%c¡Hola! 👋', styles);
            console.log('%c¿Curioso sobre el código? Este sitio está construido con:', 'font-size: 14px; color: #64748B;');
            console.log('%c• HTML5 semántico y accesible', 'font-size: 13px; color: #475569;');
            console.log('%c• CSS moderno con variables y glassmorphism', 'font-size: 13px; color: #475569;');
            console.log('%c• JavaScript vanilla, modular y performante', 'font-size: 13px; color: #475569;');
            console.log('%c• Cero frameworks, máxima velocidad ⚡', 'font-size: 13px; color: #475569;');
            console.log('%c→ linkedin.com/in/nicolas-ignacio-sanchez-negrete', 'font-size: 14px; color: #0066FF; font-weight: 600;');
        }
    };

    // =========================================================================
    // INICIALIZACIÓN
    // =========================================================================

    function init() {
        Navigation.init();
        Services.init();
        Testimonials.init();
        Animations.init();
        SmoothScroll.init();
        Accessibility.init();
        ConsoleMessage.init();

        // Marcar como cargado
        document.body.classList.add('loaded');
    }

    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Exponer API global para debugging
    window.NicoSanchez = {
        version: '2025.1',
        modules: {
            Navigation,
            Services,
            Testimonials,
            Animations
        }
    };

})();
