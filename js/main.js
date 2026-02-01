/**
 * ============================================================================
 * NICOLÁS SÁNCHEZ - WEBSITE INTERACTIVITY
 * ============================================================================
 *
 * JavaScript modular y ligero para:
 * - Navegación móvil
 * - Animaciones de scroll (Intersection Observer)
 * - Navegación suave
 * - Acordeón de servicios
 * - Carrusel premium con loop infinito, swipe/drag, autoplay
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
        sections: document.querySelectorAll('section'),
        // Elementos para servicios y carrusel
        serviceItems: document.querySelectorAll('.service-item'),
        carousel: document.getElementById('services-carousel'),
        carouselTrack: document.getElementById('carousel-track'),
        carouselProgress: document.getElementById('carousel-progress')
    };

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    function initMobileNav() {
        if (!DOM.navToggle || !DOM.navMenu) return;

        DOM.navToggle.addEventListener('click', toggleMenu);

        DOM.navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (e) => {
            if (!DOM.navMenu.contains(e.target) && !DOM.navToggle.contains(e.target)) {
                closeMenu();
            }
        });

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

    function initNavScroll() {
        if (!DOM.nav) return;

        const scrollThreshold = 50;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > scrollThreshold) {
                DOM.nav.classList.add('scrolled');
            } else {
                DOM.nav.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // ========================================================================
    // ACCORDION (Servicios) - Solo funcionalidad del acordeón
    // ========================================================================

    function initAccordion() {
        if (!DOM.serviceItems.length) return;

        DOM.serviceItems.forEach(item => {
            const header = item.querySelector('.service-item__header');

            if (header) {
                header.addEventListener('click', () => toggleAccordionItem(item));

                // Soporte para teclado
                header.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleAccordionItem(item);
                    }
                });

                // Abrir acordeón al hacer hover
                item.addEventListener('mouseenter', () => {
                    DOM.serviceItems.forEach(i => {
                        i.classList.remove('active');
                        const h = i.querySelector('.service-item__header');
                        if (h) h.setAttribute('aria-expanded', 'false');
                    });

                    item.classList.add('active');
                    if (header) header.setAttribute('aria-expanded', 'true');
                });
            }
        });

        // Abrir el primer item por defecto
        if (DOM.serviceItems[0]) {
            DOM.serviceItems[0].classList.add('active');
            const firstHeader = DOM.serviceItems[0].querySelector('.service-item__header');
            if (firstHeader) {
                firstHeader.setAttribute('aria-expanded', 'true');
            }
        }
    }

    function toggleAccordionItem(item) {
        const isActive = item.classList.contains('active');
        const header = item.querySelector('.service-item__header');

        DOM.serviceItems.forEach(i => {
            i.classList.remove('active');
            const h = i.querySelector('.service-item__header');
            if (h) h.setAttribute('aria-expanded', 'false');
        });

        if (!isActive) {
            item.classList.add('active');
            if (header) header.setAttribute('aria-expanded', 'true');
        }
    }

    // ========================================================================
    // CARRUSEL PREMIUM - Loop infinito con swipe/drag
    // ========================================================================

    /**
     * Array de imágenes para el carrusel
     * Rutas relativas desde la raíz del proyecto
     */
    const carouselImages = [
        'Public/Images/Activities/Influencer & Partner Marketing/Livestream.jpg',
        'Public/Images/Activities/Influencer & Partner Marketing/Livestream2.jpg',
        'Public/Images/Activities/Influencer & Partner Marketing/Imagen2.jpg',
        'Public/Images/Activities/Influencer & Partner Marketing/Imagen3.jpg',
        'Public/Images/Activities/Influencer & Partner Marketing/Imagen4.png',
        'Public/Images/Activities/ATL & BTL Marketing/Metro_ATL_Marketing.jpg',
        'Public/Images/Activities/Performance Data-First/Performance data-first.png',
        'Public/Images/Activities/Product Marketing/Modding.jpg',
        'Public/Images/Activities/Product Marketing/Imagen9.png',
        'Public/Images/Activities/Product Marketing/Imagen10.png',
        'Public/Images/Activities/Events & Activations/Tournament.jpg',
        'Public/Images/Activities/Events & Activations/AGS - Aorus Stage 2023.jpg',
        'Public/Images/Activities/Events & Activations/gamerscity.jpg'
    ];

    // Estado del carrusel
    const carousel = {
        track: null,
        slides: [],
        currentIndex: 1, // Empieza en 1 porque hay clones al inicio
        slideWidth: 0,
        autoplayInterval: null,
        autoplayDelay: 2000,
        progressBar: null,
        progressInterval: null,
        isDragging: false,
        startX: 0,
        currentX: 0,
        translateX: 0,
        isPaused: false,
        isTransitioning: false,
        initialized: false
    };

    /**
     * Inicializa el carrusel
     */
    function initCarousel() {
        carousel.track = document.getElementById('carousel-track');
        carousel.progressBar = document.getElementById('carousel-progress');

        if (!carousel.track) return;

        // Generar slides con clones para loop infinito
        generateSlides();

        // Esperar a que las imágenes carguen para calcular dimensiones
        const images = carousel.track.querySelectorAll('img');
        let loadedCount = 0;
        const totalImages = images.length;

        const onImageLoad = () => {
            loadedCount++;
            if (loadedCount >= Math.min(3, totalImages)) {
                // Inicializar cuando las primeras imágenes carguen
                initCarouselAfterLoad();
            }
        };

        images.forEach(img => {
            if (img.complete) {
                onImageLoad();
            } else {
                img.addEventListener('load', onImageLoad);
                img.addEventListener('error', onImageLoad);
            }
        });

        // Fallback si las imágenes tardan mucho
        setTimeout(() => {
            if (loadedCount < 3) {
                initCarouselAfterLoad();
            }
        }, 1000);
    }

    /**
     * Inicializa el carrusel después de cargar imágenes
     */
    function initCarouselAfterLoad() {
        if (carousel.initialized) return;
        carousel.initialized = true;

        // Calcular dimensiones
        calculateDimensions();

        // Posicionar en el primer slide real (después del clon)
        setInitialPosition();

        // Actualizar clases de estado
        updateSlideClasses();

        // Iniciar autoplay
        startAutoplay();

        // Event listeners
        setupEventListeners();

        // Recalcular en resize
        window.addEventListener('resize', debounce(() => {
            calculateDimensions();
            setPositionWithoutAnimation();
            updateSlideClasses();
        }, 150));
    }

    /**
     * Genera los slides del carrusel con clones para loop infinito
     */
    function generateSlides() {
        const fragment = document.createDocumentFragment();

        // Crear slides principales
        const slideElements = carouselImages.map((src, index) => {
            return createSlideElement(src, index, index === 0);
        });

        // Clonar último slide al inicio y primer slide al final para loop infinito
        const firstClone = createSlideElement(carouselImages[carouselImages.length - 1], 'clone-last', false);
        const lastClone = createSlideElement(carouselImages[0], 'clone-first', false);

        firstClone.classList.add('is-clone');
        lastClone.classList.add('is-clone');

        // Agregar: clon del último + slides + clon del primero
        fragment.appendChild(firstClone);
        slideElements.forEach(slide => fragment.appendChild(slide));
        fragment.appendChild(lastClone);

        carousel.track.appendChild(fragment);
        carousel.slides = Array.from(carousel.track.children);
    }

    /**
     * Crea un elemento slide individual
     */
    function createSlideElement(src, index, isFirst) {
        const slide = document.createElement('div');
        slide.className = 'carousel__slide';
        slide.dataset.index = index;

        const wrapper = document.createElement('div');
        wrapper.className = 'carousel__image-wrapper';

        const img = document.createElement('img');
        img.className = 'carousel__image';
        img.src = src;
        img.alt = `Actividad ${typeof index === 'number' ? index + 1 : ''}`;
        // Lazy loading para imágenes no visibles inicialmente
        if (!isFirst) {
            img.loading = 'lazy';
        }

        wrapper.appendChild(img);
        slide.appendChild(wrapper);

        return slide;
    }

    /**
     * Calcula las dimensiones del slide basado en el viewport
     */
    function calculateDimensions() {
        if (!carousel.slides.length) return;

        const firstSlide = carousel.slides[0];
        carousel.slideWidth = firstSlide.offsetWidth;
    }

    /**
     * Posiciona el carrusel en el primer slide real
     */
    function setInitialPosition() {
        carousel.currentIndex = 1; // El índice 1 es el primer slide real (0 es el clon)
        const offset = -carousel.currentIndex * carousel.slideWidth;
        carousel.translateX = offset;
        carousel.track.style.transform = `translateX(${offset}px)`;
    }

    /**
     * Mueve el carrusel sin animación (para reposicionar después del loop)
     */
    function setPositionWithoutAnimation() {
        carousel.track.classList.remove('is-animating');
        const offset = -carousel.currentIndex * carousel.slideWidth;
        carousel.translateX = offset;
        carousel.track.style.transform = `translateX(${offset}px)`;
    }

    /**
     * Actualiza las clases de estado de los slides
     */
    function updateSlideClasses() {
        carousel.slides.forEach((slide, index) => {
            slide.classList.remove('is-active', 'is-prev', 'is-next');

            if (index === carousel.currentIndex) {
                slide.classList.add('is-active');
            } else if (index === carousel.currentIndex - 1) {
                slide.classList.add('is-prev');
            } else if (index === carousel.currentIndex + 1) {
                slide.classList.add('is-next');
            }
        });
    }

    /**
     * Avanza al siguiente slide
     */
    function nextSlide() {
        if (carousel.isTransitioning) return;

        carousel.isTransitioning = true;
        carousel.currentIndex++;

        animateToCurrentSlide(() => {
            // Si llegamos al clon del primer slide, saltar al primer slide real
            if (carousel.currentIndex >= carousel.slides.length - 1) {
                carousel.currentIndex = 1;
                setPositionWithoutAnimation();
            }
            carousel.isTransitioning = false;
        });

        updateSlideClasses();
    }

    /**
     * Retrocede al slide anterior
     */
    function prevSlide() {
        if (carousel.isTransitioning) return;

        carousel.isTransitioning = true;
        carousel.currentIndex--;

        animateToCurrentSlide(() => {
            // Si llegamos al clon del último slide, saltar al último slide real
            if (carousel.currentIndex <= 0) {
                carousel.currentIndex = carousel.slides.length - 2;
                setPositionWithoutAnimation();
            }
            carousel.isTransitioning = false;
        });

        updateSlideClasses();
    }

    /**
     * Anima el carrusel a la posición actual
     */
    function animateToCurrentSlide(callback) {
        carousel.track.classList.add('is-animating');
        const offset = -carousel.currentIndex * carousel.slideWidth;
        carousel.translateX = offset;
        carousel.track.style.transform = `translateX(${offset}px)`;

        // Esperar a que termine la transición
        setTimeout(() => {
            carousel.track.classList.remove('is-animating');
            if (callback) callback();
        }, 500); // Duración de la transición CSS
    }

    /**
     * Inicia el autoplay
     */
    function startAutoplay() {
        if (carousel.autoplayInterval) return;

        resetProgress();

        carousel.autoplayInterval = setInterval(() => {
            if (!carousel.isPaused && !carousel.isDragging) {
                nextSlide();
                resetProgress();
            }
        }, carousel.autoplayDelay);
    }

    /**
     * Detiene el autoplay
     */
    function stopAutoplay() {
        if (carousel.autoplayInterval) {
            clearInterval(carousel.autoplayInterval);
            carousel.autoplayInterval = null;
        }
        if (carousel.progressInterval) {
            clearInterval(carousel.progressInterval);
            carousel.progressInterval = null;
        }
    }

    /**
     * Reinicia la barra de progreso
     */
    function resetProgress() {
        if (!carousel.progressBar) return;

        if (carousel.progressInterval) {
            clearInterval(carousel.progressInterval);
        }

        let progress = 0;
        carousel.progressBar.style.width = '0%';

        carousel.progressInterval = setInterval(() => {
            if (!carousel.isPaused && !carousel.isDragging) {
                progress += 100 / (carousel.autoplayDelay / 50);
                carousel.progressBar.style.width = `${Math.min(progress, 100)}%`;
            }
        }, 50);
    }

    /**
     * Configura todos los event listeners
     */
    function setupEventListeners() {
        const carouselEl = document.getElementById('services-carousel');
        if (!carouselEl) return;

        // === HOVER: Pausar autoplay ===
        carouselEl.addEventListener('mouseenter', () => {
            carousel.isPaused = true;
        });

        carouselEl.addEventListener('mouseleave', () => {
            carousel.isPaused = false;
        });

        // === TOUCH EVENTS (Mobile) ===
        carousel.track.addEventListener('touchstart', handleTouchStart, { passive: true });
        carousel.track.addEventListener('touchmove', handleTouchMove, { passive: false });
        carousel.track.addEventListener('touchend', handleTouchEnd);

        // === POINTER EVENTS (Desktop drag) ===
        carousel.track.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        // Prevenir drag de imágenes nativo
        carousel.track.addEventListener('dragstart', (e) => e.preventDefault());
    }

    /**
     * Manejador de touchstart
     */
    function handleTouchStart(e) {
        carousel.isDragging = true;
        carousel.startX = e.touches[0].clientX;
        carousel.currentX = carousel.startX;
        carousel.track.classList.remove('is-animating');
        carousel.track.classList.add('is-dragging');
    }

    /**
     * Manejador de touchmove
     */
    function handleTouchMove(e) {
        if (!carousel.isDragging) return;

        carousel.currentX = e.touches[0].clientX;
        const diff = carousel.currentX - carousel.startX;

        // Mover el track siguiendo el dedo
        carousel.track.style.transform = `translateX(${carousel.translateX + diff}px)`;

        // Prevenir scroll vertical mientras se arrastra
        if (Math.abs(diff) > 10) {
            e.preventDefault();
        }
    }

    /**
     * Manejador de touchend
     */
    function handleTouchEnd() {
        if (!carousel.isDragging) return;

        carousel.isDragging = false;
        carousel.track.classList.remove('is-dragging');

        const diff = carousel.currentX - carousel.startX;
        const threshold = carousel.slideWidth * 0.2; // 20% del ancho del slide

        if (Math.abs(diff) > threshold) {
            // Cambiar de slide
            if (diff < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            // Volver a la posición actual
            animateToCurrentSlide();
        }

        resetProgress();
    }

    /**
     * Manejador de mousedown (desktop drag)
     */
    function handleMouseDown(e) {
        carousel.isDragging = true;
        carousel.startX = e.clientX;
        carousel.currentX = carousel.startX;
        carousel.track.classList.remove('is-animating');
        carousel.track.classList.add('is-dragging');
    }

    /**
     * Manejador de mousemove (desktop drag)
     */
    function handleMouseMove(e) {
        if (!carousel.isDragging) return;

        e.preventDefault();
        carousel.currentX = e.clientX;
        const diff = carousel.currentX - carousel.startX;

        carousel.track.style.transform = `translateX(${carousel.translateX + diff}px)`;
    }

    /**
     * Manejador de mouseup (desktop drag)
     */
    function handleMouseUp() {
        if (!carousel.isDragging) return;

        carousel.isDragging = false;
        carousel.track.classList.remove('is-dragging');

        const diff = carousel.currentX - carousel.startX;
        const threshold = carousel.slideWidth * 0.15; // 15% del ancho para desktop

        if (Math.abs(diff) > threshold) {
            if (diff < 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        } else {
            animateToCurrentSlide();
        }

        resetProgress();
    }

    /**
     * Utilidad debounce para resize
     */
    function debounce(func, wait) {
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

    // ========================================================================
    // SCROLL ANIMATIONS
    // ========================================================================

    function initScrollAnimations() {
        if (!('IntersectionObserver' in window)) {
            DOM.fadeElements.forEach(el => el.classList.add('visible'));
            return;
        }

        const fadeObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    fadeObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        DOM.fadeElements.forEach(el => fadeObserver.observe(el));

        // Observer para cards y elementos de sección
        const cards = document.querySelectorAll('.card, .testimonial-card-new, .focus-item');

        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }, index * 80);
                    cardObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            cardObserver.observe(card);
        });
    }

    // ========================================================================
    // SMOOTH SCROLL
    // ========================================================================

    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');

                if (!href || href === '#') return;

                const target = document.querySelector(href);
                if (!target) return;

                e.preventDefault();

                const navHeight = DOM.nav ? DOM.nav.offsetHeight : 0;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });

                history.pushState(null, null, href);
            });
        });
    }

    // ========================================================================
    // ACTIVE NAV LINK HIGHLIGHTING
    // ========================================================================

    function initActiveNavHighlight() {
        if (!DOM.sections.length) return;

        const navHeight = DOM.nav ? DOM.nav.offsetHeight : 0;

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    if (!id) return;

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
    // ACCESSIBILITY
    // ========================================================================

    function initAccessibility() {
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
    }

    // ========================================================================
    // EASTER EGG
    // ========================================================================

    function initConsoleMessage() {
        console.log('%c¡Hola! 👋', 'font-size: 24px; font-weight: bold; color: #0066FF;');
        console.log('%cSi estás viendo esto, probablemente te interesa el código.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Este sitio está construido con HTML, CSS y JavaScript puro.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Sin frameworks, sin dependencias innecesarias.', 'font-size: 14px; color: #6B7280;');
        console.log('%c→ Performance y simplicidad por sobre todo.', 'font-size: 14px; color: #6B7280;');
        console.log('%c¿Conectamos? → linkedin.com/in/nicolas-ignacio-sanchez-negrete', 'font-size: 14px; color: #0066FF;');
    }

    // ========================================================================
    // INITIALIZATION
    // ========================================================================

    function init() {
        initMobileNav();
        initNavScroll();
        initAccordion();
        initCarousel();
        initScrollAnimations();
        initSmoothScroll();
        initActiveNavHighlight();
        initAccessibility();
        initConsoleMessage();

        document.body.classList.add('loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ========================================================================
    // EXPORT
    // ========================================================================

    window.NicoSanchez = {
        init,
        closeMenu,
        nextSlide,
        prevSlide
    };

})();
