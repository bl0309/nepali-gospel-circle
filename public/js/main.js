// Enhanced Main JavaScript with Advanced Animations and Interactions

// Page Loading Animation
document.addEventListener('DOMContentLoaded', function () {
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'page-loading';
    loadingScreen.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(loadingScreen);

    // Hide loading screen after page loads
    window.addEventListener('load', function () {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }, 800);
    });
});

// Enhanced Navbar with Glassmorphism Effect
window.addEventListener('scroll', function () {
    const navbar = document.getElementById('navbar');
    const scrollPosition = window.scrollY;

    if (scrollPosition > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Enhanced Mobile Menu with Animations
const mobileMenu = document.querySelector('.mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', function () {
    navMenu.classList.toggle('active');
    this.classList.toggle('active');

    // Animate hamburger menu
    const spans = this.querySelectorAll('span');
    spans.forEach((span, index) => {
        if (this.classList.contains('active')) {
            if (index === 0) span.style.transform = 'rotate(45deg) translate(5px, 5px)';
            if (index === 1) span.style.opacity = '0';
            if (index === 2) span.style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            span.style.transform = 'none';
            span.style.opacity = '1';
        }
    });
});

// Close menu when clicking navigation links
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', function() {
        // Remove active class from menu and hamburger
        navMenu.classList.remove('active');
        mobileMenu.classList.remove('active');
        
        // Reset hamburger animation
        const spans = mobileMenu.querySelectorAll('span');
        spans.forEach(span => {
            span.style.transform = 'none';
            span.style.opacity = '1';
        });
    });
});

// Smooth Scrolling with Enhanced Easing
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            // Custom smooth scroll with easing
            smoothScrollTo(offsetPosition, 1000);
        }
    });
});

// Custom smooth scroll function with easing
function smoothScrollTo(endY, duration) {
    const startY = window.scrollY;
    const distanceY = endY - startY;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = easeInOutCubic(timeElapsed, startY, distanceY, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }

    function easeInOutCubic(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t * t + b;
        t -= 2;
        return c / 2 * (t * t * t + 2) + b;
    }

    requestAnimationFrame(animation);
}

// Enhanced Intersection Observer with Multiple Animation Types
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');

            // Trigger counter animations
            if (entry.target.classList.contains('counter')) {
                animateCounter(entry.target);
            }

            // Staggered animations for grid items
            if (entry.target.parentElement.classList.contains('about-grid') ||
                entry.target.parentElement.classList.contains('services-grid') ||
                entry.target.parentElement.classList.contains('messages-grid')) {

                const siblings = Array.from(entry.target.parentElement.children);
                const index = siblings.indexOf(entry.target);

                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, index * 100);
            }
        }
    });
}, observerOptions);

// Observe all animation elements
document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in, .rotate-in, .text-reveal, .image-reveal').forEach(el => {
    observer.observe(el);
});

// Enhanced Parallax Effect for Hero Section
window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');

    if (hero) {
        // Parallax background
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;

        // Parallax content with different speed
        if (heroContent) {
            heroContent.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
    }
});

// Particle System for Hero Section
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.particleCount = 50;
        this.canvas = null;
        this.ctx = null;
        this.init();
    }

    init() {
        // Create canvas for particles
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'particles';
        this.ctx = this.canvas.getContext('2d');

        // Set canvas size
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Create particles
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(this.createParticle());
        }

        // Start animation
        this.animate();

        // Add to hero section
        const hero = document.querySelector('.hero');
        if (hero) {
            hero.appendChild(this.canvas);
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticle() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 3 + 1,
            opacity: Math.random() * 0.5 + 0.1,
            color: Math.random() > 0.5 ? 'rgba(81, 65, 181, 0.3)' : 'rgba(231, 111, 81, 0.3)'
        };
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;

            // Draw particle
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize particle system
// new ParticleSystem();

// Enhanced Interactive Cards with 3D Effects
function enhance3DCards() {
    const cards = document.querySelectorAll('.about-card, .service-card, .message-card, .team-card');

    cards.forEach(card => {
        card.addEventListener('mouseenter', function (e) {
            this.style.transition = 'transform 0.1s ease-out';
        });

        card.addEventListener('mousemove', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', function () {
            this.style.transition = 'transform 0.3s ease-out';
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Initialize 3D card effects
document.addEventListener('DOMContentLoaded', enhance3DCards);

// Enhanced Ripple Effect
function createRipple(event) {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple-effect');

    const ripple = button.getElementsByClassName('ripple-effect')[0];
    if (ripple) {
        ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
        circle.remove();
    }, 600);
}

// Add ripple effect to buttons
document.querySelectorAll('.btn, .message-card, .event-item').forEach(element => {
    element.addEventListener('click', createRipple);
});

// Enhanced YouTube Video Modal
class VideoModal {
    constructor() {
        this.modal = null;
        this.player = null;
        this.init();
    }

    init() {
        this.createModal();
        this.bindEvents();
    }

    createModal() {
        const modalHTML = `
            <div class="youtube-modal" id="youtube-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="modal-title">Video Title</h3>
                        <button class="close-modal" aria-label="Close video">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="video-container">
                        <iframe id="youtube-player" src="" allowfullscreen allow="autoplay"></iframe>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('youtube-modal');
        this.player = document.getElementById('youtube-player');
    }

    bindEvents() {
        // Message card clicks
        document.querySelectorAll('.message-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const videoId = card.dataset.videoId;
                const title = card.querySelector('h3').textContent;

                if (videoId) {
                    this.open(videoId, title);
                }
            });

            // Keyboard accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });

            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
        });

        // Close button
        this.modal.querySelector('.close-modal').addEventListener('click', () => {
            this.close();
        });

        // Click outside to close
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    open(videoId, title) {
        const modalTitle = document.getElementById('modal-title');
        modalTitle.textContent = title;

        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&color=white`;
        this.player.src = embedUrl;

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus management
        setTimeout(() => {
            this.modal.querySelector('.close-modal').focus();
        }, 100);

        // Analytics tracking
        this.trackVideoView(videoId, title);
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.player.src = '';

        // Return focus to trigger element
        const activeCard = document.querySelector('.message-card:focus');
        if (activeCard) {
            activeCard.focus();
        }
    }

    trackVideoView(videoId, title) {
        // Track video views (implement your analytics here)
        console.log(`Video viewed: ${title} (${videoId})`);

        // Example Google Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'video_play', {
                'video_title': title,
                'video_id': videoId,
                'video_provider': 'youtube'
            });
        }
    }
}

// Initialize video modal
document.addEventListener('DOMContentLoaded', () => {
    new VideoModal();
});

// Enhanced Counter Animation
function animateCounter(element) {
    const target = parseInt(element.dataset.target) || 100;
    const duration = parseInt(element.dataset.duration) || 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Enhanced Scroll Animations with Performance Optimization
let ticking = false;

function updateScrollAnimations() {
    const scrollTop = window.pageYOffset;

    // Parallax effects
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    parallaxElements.forEach(element => {
        const speed = element.dataset.parallax || 0.5;
        const yPos = -(scrollTop * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });

    // Fade elements based on scroll position
    const fadeElements = document.querySelectorAll('[data-fade]');
    fadeElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('fade-in-visible');
        }
    });

    ticking = false;
}

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(updateScrollAnimations);
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

// Enhanced Image Lazy Loading with Intersection Observer
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;

            // Fade in effect
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.5s ease-in-out';

            img.onload = () => {
                img.style.opacity = '1';
                img.classList.add('loaded');
            };

            // Load the image
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }

            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '50px 0px',
    threshold: 0.01
});

// Observe all lazy images
document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// Dynamic Background Color Change Based on Scroll
function updateBackgroundColor() {
    const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
    const hue = Math.floor(scrollPercentage * 3.6); // 0-360 degrees

    document.documentElement.style.setProperty('--dynamic-hue', hue);
}

window.addEventListener('scroll', updateBackgroundColor);

// Enhanced Event Item Interactions
document.querySelectorAll('.event-item').forEach(item => {
    item.addEventListener('click', function () {
        const eventTitle = this.querySelector('h3').textContent;
        const eventDate = this.querySelector('.event-date').textContent;
        const eventDescription = this.querySelector('p').textContent;

        // Create enhanced modal for event details
        showEventModal(eventTitle, eventDate, eventDescription);
    });

    // Add hover sound effect (optional)
    item.addEventListener('mouseenter', function () {
        // You can add a subtle sound effect here
        // playHoverSound();
    });
});

function showEventModal(title, date, description) {
    const modal = document.createElement('div');
    modal.className = 'event-modal';
    modal.innerHTML = `
        <div class="event-modal-content">
            <div class="event-modal-header">
                <h3>${title}</h3>
                <button class="close-event-modal" aria-label="Close event details">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="event-modal-body">
                <div class="event-modal-date">${date}</div>
                <p>${description}</p>
                <div class="event-modal-actions">
                    <button class="btn btn-primary" onclick="addToCalendar('${title}', '${date}')">
                        <i class="fas fa-calendar-plus"></i>
                        Add to Calendar
                    </button>
                    <button class="btn btn-secondary" onclick="shareEvent('${title}', '${date}')">
                        <i class="fas fa-share"></i>
                        Share Event
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Close button functionality
    modal.querySelector('.close-event-modal').addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
        }, 300);
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    });
}

// Add to Calendar functionality
function addToCalendar(title, date) {
    const startDate = new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(new Date(date).getTime() + 2 * 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Nepali Gospel Circle Event')}&location=${encodeURIComponent('4401 N State Highway 161, Irving, Texas 75038')}`;

    window.open(googleCalendarUrl, '_blank');
}

// Share Event functionality
function shareEvent(title, date) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `Join us for ${title} on ${date}`,
            url: window.location.href
        });
    } else {
        // Fallback to clipboard
        const shareText = `Join us for ${title} on ${date} at Nepali Gospel Circle. ${window.location.href}`;
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Event details copied to clipboard!');
        });
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Enhanced Typewriter Effect
class TypeWriter {
    constructor(element, words, options = {}) {
        this.element = element;
        this.words = words;
        this.speed = options.speed || 100;
        this.deleteSpeed = options.deleteSpeed || 50;
        this.pauseTime = options.pauseTime || 2000;
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.isDeleting = false;
        this.type();
    }

    type() {
        const currentWord = this.words[this.currentWordIndex];

        if (this.isDeleting) {
            this.element.textContent = currentWord.substring(0, this.currentCharIndex - 1);
            this.currentCharIndex--;
        } else {
            this.element.textContent = currentWord.substring(0, this.currentCharIndex + 1);
            this.currentCharIndex++;
        }

        let typeSpeed = this.isDeleting ? this.deleteSpeed : this.speed;

        if (!this.isDeleting && this.currentCharIndex === currentWord.length) {
            typeSpeed = this.pauseTime;
            this.isDeleting = true;
        } else if (this.isDeleting && this.currentCharIndex === 0) {
            this.isDeleting = false;
            this.currentWordIndex = (this.currentWordIndex + 1) % this.words.length;
            typeSpeed = 500;
        }

        setTimeout(() => this.type(), typeSpeed);
    }
}

// Initialize typewriter effect for hero subtitle
document.addEventListener('DOMContentLoaded', () => {
    const heroSubtitle = document.querySelector('.hero p');
    if (heroSubtitle) {
        const originalText = heroSubtitle.textContent;
        const words = [
            originalText,
            "Where Faith Meets Community",
            "Growing Together in Christ",
            "Your Spiritual Home Awaits"
        ];

        setTimeout(() => {
            new TypeWriter(heroSubtitle, words, {
                speed: 80,
                deleteSpeed: 40,
                pauseTime: 3000
            });
        }, 2000);
    }
});

// Enhanced Floating Action Button
function createFloatingActionButton() {
    const fab = document.createElement('a');
    fab.className = 'fab';
    fab.href = '#contact';
    fab.innerHTML = '<i class="fas fa-phone"></i>';
    fab.title = 'Contact Us';
    fab.setAttribute('aria-label', 'Contact Us');

    document.body.appendChild(fab);

    // Hide/show FAB based on scroll position
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 300) {
            fab.style.transform = 'translateY(100px)';
        } else if (scrollTop < lastScrollTop) {
            fab.style.transform = 'translateY(0)';
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
}

// Initialize FAB
document.addEventListener('DOMContentLoaded', createFloatingActionButton);

// Enhanced Text Reveal Animation
function initTextReveal() {
    const textElements = document.querySelectorAll('.text-reveal');

    const textObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                textObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    textElements.forEach(element => {
        textObserver.observe(element);
    });
}

// Initialize text reveal
document.addEventListener('DOMContentLoaded', initTextReveal);

// Mouse Trail Effect
class MouseTrail {
    constructor() {
        this.dots = [];
        this.mouse = { x: 0, y: 0 };
        this.init();
    }

    init() {
        // Create trail dots
        for (let i = 0; i < 20; i++) {
            const dot = document.createElement('div');
            dot.className = 'mouse-trail-dot';
            dot.style.cssText = `
                position: fixed;
                width: 4px;
                height: 4px;
                background: rgba(81, 65, 181, ${0.8 - i * 0.04});
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(dot);
            this.dots.push({
                element: dot,
                x: 0,
                y: 0
            });
        }

        // Track mouse movement
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Animate trail
        this.animate();
    }

    animate() {
        let x = this.mouse.x;
        let y = this.mouse.y;

        this.dots.forEach((dot, index) => {
            dot.element.style.left = x + 'px';
            dot.element.style.top = y + 'px';

            const nextDot = this.dots[index + 1] || this.dots[0];
            x += (nextDot.x - x) * 0.3;
            y += (nextDot.y - y) * 0.3;

            dot.x = x;
            dot.y = y;
        });

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize mouse trail (optional - can be disabled for performance)
// document.addEventListener('DOMContentLoaded', () => {
//     new MouseTrail();
// });

// Enhanced Performance Monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.init();
    }

    init() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            const navigation = performance.getEntriesByType('navigation')[0];
            this.metrics.loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            this.metrics.totalLoadTime = navigation.loadEventEnd - navigation.fetchStart;

            console.log('Performance Metrics:', this.metrics);
        });

        // Monitor scroll performance
        let scrollCount = 0;
        let lastScrollTime = 0;

        window.addEventListener('scroll', () => {
            scrollCount++;
            lastScrollTime = performance.now();
        });

        setInterval(() => {
            if (scrollCount > 0) {
                this.metrics.scrollPerformance = scrollCount;
                scrollCount = 0;
            }
        }, 1000);
    }
}

// Initialize performance monitoring
// new PerformanceMonitor();

// Enhanced Accessibility Features
function enhanceAccessibility() {
    // Skip navigation link
    const skipLink = document.createElement('a');
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: var(--secondary-color);
        color: white;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        z-index: 10000;
        transition: top 0.3s ease;
    `;

    skipLink.addEventListener('focus', () => {
        skipLink.style.top = '6px';
    });

    skipLink.addEventListener('blur', () => {
        skipLink.style.top = '-40px';
    });

    document.body.insertBefore(skipLink, document.body.firstChild);

    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Tab key navigation enhancement
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }

        // Escape key to close modals
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.youtube-modal.active, .event-modal.active');
            if (activeModal) {
                const closeButton = activeModal.querySelector('.close-modal, .close-event-modal');
                if (closeButton) closeButton.click();
            }
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    // ARIA live region for dynamic content
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    `;
    document.body.appendChild(liveRegion);

    window.announceToScreenReader = (message) => {
        liveRegion.textContent = message;
        setTimeout(() => {
            liveRegion.textContent = '';
        }, 1000);
    };
}

// Initialize accessibility enhancements
document.addEventListener('DOMContentLoaded', enhanceAccessibility);

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Enhanced Error Handling
window.addEventListener('error', (event) => {
    console.error('JavaScript Error:', event.error);

    // Show user-friendly error message
    showNotification('Something went wrong. Please refresh the page.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    event.preventDefault();
});

// Dark Mode Toggle (Optional)
function initDarkModeToggle() {
    const darkModeToggle = document.createElement('button');
    darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    darkModeToggle.className = 'dark-mode-toggle';
    darkModeToggle.setAttribute('aria-label', 'Toggle dark mode');
    darkModeToggle.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: white;
        cursor: pointer;
        z-index: 1001;
        transition: all 0.3s ease;
    `;

    // Check for saved preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');

        darkModeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        localStorage.setItem('darkMode', isDark);

        announceToScreenReader(isDark ? 'Dark mode enabled' : 'Light mode enabled');
    });

    document.body.appendChild(darkModeToggle);
}

// Initialize dark mode toggle
// document.addEventListener('DOMContentLoaded', initDarkModeToggle);

// Enhanced Contact Form (if you add one)
function enhanceContactForm() {
    const contactForm = document.querySelector('#contact-form');
    if (!contactForm) return;

    const inputs = contactForm.querySelectorAll('input, textarea');

    inputs.forEach(input => {
        // Floating label effect
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });

        // Real-time validation
        input.addEventListener('input', () => {
            validateField(input);
        });
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate all fields
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            // Show loading state
            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;

            try {
                // Simulate form submission
                await new Promise(resolve => setTimeout(resolve, 2000));

                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
                announceToScreenReader('Your message has been sent successfully');
            } catch (error) {
                showNotification('Failed to send message. Please try again.', 'error');
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        }
    });
}

function validateField(field) {
    const value = field.value.trim();
    const fieldType = field.type;
    let isValid = true;
    let errorMessage = '';

    // Remove existing error
    const existingError = field.parentElement.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }

    // Validation rules
    if (field.required && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    } else if (fieldType === 'email' && value && !isValidEmail(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
    } else if (fieldType === 'tel' && value && !isValidPhone(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
    }

    // Show error if invalid
    if (!isValid) {
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = errorMessage;
        errorElement.style.cssText = `
            color: #e74c3c;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
        `;
        field.parentElement.appendChild(errorElement);
        field.classList.add('error');
    } else {
        field.classList.remove('error');
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Initialize contact form enhancements
document.addEventListener('DOMContentLoaded', enhanceContactForm);

// Add CSS for new features
const additionalCSS = `
    .event-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .event-modal.active {
        opacity: 1;
        visibility: visible;
    }
    
    .event-modal-content {
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        transform: scale(0.7);
        transition: transform 0.3s ease;
    }
    
    .event-modal.active .event-modal-content {
        transform: scale(1);
    }
    
    .event-modal-header {
        padding: 2rem;
        background: linear-gradient(135deg, var(--secondary-color), var(--accent-color));
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 20px 20px 0 0;
    }
    
    .event-modal-body {
        padding: 2rem;
    }
    
    .event-modal-date {
        background: var(--secondary-color);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        display: inline-block;
        margin-bottom: 1rem;
        font-weight: 600;
    }
    
    .event-modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        min-width: 300px;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification-content {
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification-success {
        border-left: 4px solid #27ae60;
    }
    
    .notification-error {
        border-left: 4px solid #e74c3c;
    }
    
    .notification i {
        color: #27ae60;
    }
    
    .notification-error i {
        color: #e74c3c;
    }
    
    .keyboard-navigation *:focus {
        outline: 3px solid var(--secondary-color) !important;
        outline-offset: 2px !important;
    }
    
    @media (max-width: 768px) {
        .event-modal-content {
            margin: 1rem;
            width: calc(100% - 2rem);
        }
        
        .event-modal-actions {
            flex-direction: column;
        }
        
        .notification {
            right: 10px;
            left: 10px;
            min-width: auto;
            transform: translateY(-100px);
        }
        
        .notification.show {
            transform: translateY(0);
        }
    }
`;

// Add additional CSS to the document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalCSS;
document.head.appendChild(styleSheet);

// Initialize all enhanced features
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎉 Enhanced Nepali Gospel Circle website loaded successfully!');

    // Optional: Add performance timing
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`⚡ Page loaded in ${Math.round(loadTime)}ms`);
    });
});


// Hero Image Slider Functionality
class HeroSlider {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.hero-slide');
        this.dots = document.querySelectorAll('.hero-dot');
        this.totalSlides = this.slides.length;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 3000; // 3 seconds

        this.init();
    }

    init() {
        if (this.slides.length === 0) return;

        // Start autoplay
        this.startAutoPlay();

        // Pause on hover
        const heroSection = document.querySelector('.hero');
        heroSection.addEventListener('mouseenter', () => this.pauseAutoPlay());
        heroSection.addEventListener('mouseleave', () => this.startAutoPlay());

        // Touch/swipe support for mobile
        this.addTouchSupport();
    }

    showSlide(index) {
        // Remove active class from all slides and dots
        this.slides.forEach(slide => slide.classList.remove('active'));
        this.dots.forEach(dot => dot.classList.remove('active'));

        // Add active class to current slide and dot
        this.slides[index].classList.add('active');
        this.dots[index].classList.add('active');

        this.currentSlide = index;
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.totalSlides;
        this.showSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.showSlide(prev);
    }

    goToSlide(index) {
        this.showSlide(index);
        this.resetAutoPlay();
    }

    startAutoPlay() {
        this.pauseAutoPlay();
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, this.autoPlayDelay);
    }

    pauseAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    resetAutoPlay() {
        this.startAutoPlay();
    }

    // Fixed Touch Support - Allows Vertical Scrolling
    addTouchSupport() {
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;
        let isHorizontalSwipe = false;

        const heroSection = document.querySelector('.hero');

        heroSection.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHorizontalSwipe = false;
        }, { passive: true });

        heroSection.addEventListener('touchmove', (e) => {
            if (!isHorizontalSwipe) {
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = Math.abs(currentX - startX);
                const deltaY = Math.abs(currentY - startY);

                // Only prevent default if it's clearly a horizontal swipe
                if (deltaX > deltaY && deltaX > 30) {
                    isHorizontalSwipe = true;
                    e.preventDefault(); // Only prevent horizontal swipes
                }
                // Allow vertical scrolling by not calling preventDefault for vertical movement
            } else {
                e.preventDefault(); // Continue preventing if we determined it's horizontal
            }
        });

        heroSection.addEventListener('touchend', (e) => {
            if (isHorizontalSwipe) {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;
                this.handleSwipe(startX, endX);
            }
        }, { passive: true });
    }

    handleSwipe(startX, endX) {
        const threshold = 50; // Minimum swipe distance
        const diff = startX - endX;

        if (Math.abs(diff) < threshold) return;

        if (diff > 0) {
            // Swipe left - next slide
            this.nextSlide();
        } else {
            // Swipe right - previous slide
            this.prevSlide();
        }

        this.resetAutoPlay();
    }
}

// Global functions for button clicks
function changeSlide(direction) {
    if (direction === 1) {
        heroSlider.nextSlide();
    } else {
        heroSlider.prevSlide();
    }
    heroSlider.resetAutoPlay();
}

function currentSlide(index) {
    heroSlider.goToSlide(index - 1); // Convert to 0-based index
}

// Initialize slider when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if hero slider exists
    if (document.querySelector('.hero-slider')) {
        window.heroSlider = new HeroSlider();
        console.log('🎬 Hero image slider initialized');
    }
});

// Enhanced sliding effects
function addSlideEffect(slideIndex, effect = 'fade') {
    const slide = document.querySelectorAll('.hero-slide')[slideIndex];
    if (!slide) return;

    // Remove any existing effect classes
    slide.classList.remove('slide-left', 'slide-right', 'fade-up');

    // Add the desired effect
    slide.classList.add(effect);

    // Remove the effect class after animation completes
    setTimeout(() => {
        slide.classList.remove(effect);
    }, 1000);
}

// Keyboard navigation
document.addEventListener('keydown', function (e) {
    if (!window.heroSlider) return;

    switch (e.key) {
        case 'ArrowLeft':
            heroSlider.prevSlide();
            heroSlider.resetAutoPlay();
            break;
        case 'ArrowRight':
            heroSlider.nextSlide();
            heroSlider.resetAutoPlay();
            break;
        case ' ': // Spacebar
            e.preventDefault();
            if (heroSlider.autoPlayInterval) {
                heroSlider.pauseAutoPlay();
            } else {
                heroSlider.startAutoPlay();
            }
            break;
    }
});

// Intersection Observer to pause slider when not visible
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!window.heroSlider) return;

        if (entry.isIntersecting) {
            heroSlider.startAutoPlay();
        } else {
            heroSlider.pauseAutoPlay();
        }
    });
}, {
    threshold: 0.5
});

// Observe hero section
document.addEventListener('DOMContentLoaded', function () {
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
});