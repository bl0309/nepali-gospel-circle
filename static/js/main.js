// Navbar scroll effect
window.addEventListener('scroll', function () {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fade in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
});

// Mobile menu toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', function () {
    navMenu.classList.toggle('active');
});

// Prayer request form
document.querySelector('.prayer-form').addEventListener('submit', function (e) {
    e.preventDefault();
    alert('Thank you for your prayer request. Our prayer team will lift you up in prayer.');
    this.reset();
});

// Add floating animation to hero icons
document.addEventListener('DOMContentLoaded', function () {
    const heroIcons = document.querySelectorAll('.hero .btn i');
    heroIcons.forEach((icon, index) => {
        setTimeout(() => {
            icon.classList.add('floating');
        }, index * 200);
    });
});

// Interactive service cards
document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.03) rotate(1deg)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1) rotate(0deg)';
    });
});

// Event item click interaction
document.querySelectorAll('.event-item').forEach(item => {
    item.addEventListener('click', function () {
        const eventTitle = this.querySelector('h3').textContent;
        const eventDate = this.querySelector('.event-date').textContent;
        alert(`Event: ${eventTitle}\nDate: ${eventDate}\n\nFor more information, please contact us at (555) 123-4567`);
    });
});

// Parallax effect for hero section
window.addEventListener('scroll', function () {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const rate = scrolled * -0.5;

    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Dynamic greeting based on time
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = '';

    if (hour < 12) {
        greeting = 'Good Morning! ';
    } else if (hour < 18) {
        greeting = 'Good Afternoon! ';
    } else {
        greeting = 'Good Evening! ';
    }

    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle && !heroTitle.textContent.includes('Good')) {
        heroTitle.textContent = greeting + heroTitle.textContent;
    }
}

// Call greeting function
updateGreeting();

// Add typewriter effect to hero subtitle
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';

    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Initialize typewriter effect after page load
window.addEventListener('load', function () {
    setTimeout(() => {
        const subtitle = document.querySelector('.hero p');
        if (subtitle) {
            const originalText = subtitle.textContent;
            typeWriter(subtitle, originalText, 30);
        }
    }, 2000);
});

// Add ripple effect to buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add CSS for ripple effect
// const rippleCSS = `
//             .btn {
//                 position: relative;
//                 overflow: hidden;
//             }
            
//             .ripple {
//                 position: absolute;
//                 border-radius: 50%;
//                 background: rgba(255, 255, 255, 0.4);
//                 transform: scale(0);
//                 animation: rippleEffect 0.6s linear;
//                 pointer-events: none;
//             }
            
//             @keyframes rippleEffect {
//                 to {
//                     transform: scale(2);
//                     opacity: 0;
//                 }
//             }
//         `;

// const style = document.createElement('style');
// style.textContent = rippleCSS;
// document.head.appendChild(style);

// Add counter animation for statistics (if you want to add stats section later)
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    }

    updateCounter();
}

// Loading animation
window.addEventListener('load', function () {
    document.body.classList.add('loaded');
});

// Add loading CSS
const loadingCSS = `
            body {
                opacity: 0;
                transition: opacity 0.5s ease-in-out;
            }
            
            body.loaded {
                opacity: 1;
            }
        `;

const loadingStyle = document.createElement('style');
loadingStyle.textContent = loadingCSS;
document.head.appendChild(loadingStyle);

// YouTube Video Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Create modal HTML
    const modalHTML = `
        <div class="youtube-modal" id="youtube-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">Message Title</h3>
                    <button class="close-modal" onclick="closeVideoModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="video-container">
                    <iframe id="youtube-player" src="" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click event listeners to message cards
    const messageCards = document.querySelectorAll('.message-card');
    messageCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            const videoId = this.dataset.videoId;
            const title = this.querySelector('h3').textContent;
            
            if (videoId) {
                openVideoModal(videoId, title);
            }
        });
        
        // Add keyboard accessibility
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play video: ${card.querySelector('h3').textContent}`);
    });
    
    // Lazy loading for YouTube thumbnails
    const thumbnailImages = document.querySelectorAll('.message-thumbnail img[loading="lazy"]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                });
                observer.unobserve(img);
            }
        });
    });
    
    thumbnailImages.forEach(img => {
        imageObserver.observe(img);
    });
    
    // Close modal when clicking outside
    document.getElementById('youtube-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeVideoModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    });
});

// Open video modal function
function openVideoModal(videoId, title) {
    const modal = document.getElementById('youtube-modal');
    const modalTitle = document.getElementById('modal-title');
    const player = document.getElementById('youtube-player');
    
    // Set title
    modalTitle.textContent = title;
    
    // Set video source with autoplay
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    player.src = embedUrl;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus on close button for accessibility
    setTimeout(() => {
        modal.querySelector('.close-modal').focus();
    }, 100);
    
    // Track video view (optional analytics)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'video_play', {
            'video_title': title,
            'video_id': videoId
        });
    }
}

// Close video modal function
function closeVideoModal() {
    const modal = document.getElementById('youtube-modal');
    const player = document.getElementById('youtube-player');
    
    // Hide modal
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Stop video by clearing src
    player.src = '';
    
    // Return focus to the card that opened the modal
    const activeCard = document.querySelector('.message-card:focus');
    if (activeCard) {
        activeCard.focus();
    }
}

// YouTube API Integration (Optional - for more advanced features)
function loadYouTubeAPI() {
    // Load YouTube IFrame API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube API ready callback
function onYouTubeIframeAPIReady() {
    console.log('YouTube API loaded');
    // You can initialize YouTube players here if needed
}

// Message card hover effects
document.addEventListener('DOMContentLoaded', function() {
    const messageCards = document.querySelectorAll('.message-card');
    
    messageCards.forEach(card => {
        // Add ripple effect on click
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple-effect');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.remove();
                }
            }, 600);
        });
        
        // Animate play button on hover
        card.addEventListener('mouseenter', function() {
            const playButton = this.querySelector('.play-button');
            if (playButton) {
                playButton.style.animation = 'none';
                setTimeout(() => {
                    playButton.style.animation = 'float 2s ease-in-out infinite';
                }, 10);
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const playButton = this.querySelector('.play-button');
            if (playButton) {
                playButton.style.animation = 'none';
            }
        });
    });
});

// Utility function to get YouTube video duration (requires API key)
async function getVideoDuration(videoId, apiKey) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`);
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
            const duration = data.items[0].contentDetails.duration;
            return parseYouTubeDuration(duration);
        }
    } catch (error) {
        console.error('Error fetching video duration:', error);
    }
    return null;
}

// Parse YouTube duration format (PT1H2M3S) to readable format
function parseYouTubeDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    
    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');
    
    if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    } else {
        return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
    }
}

// Add CSS for ripple effect
const rippleCSS = `
    .message-card {
        position: relative;
        overflow: hidden;
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background: rgba(244, 162, 97, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
        z-index: 1;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes float {
        0%, 100% {
            transform: translate(-50%, -50%) translateY(0);
        }
        50% {
            transform: translate(-50%, -50%) translateY(-5px);
        }
    }
`;

// Add the CSS to the document
const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Error handling for missing video thumbnails
document.addEventListener('DOMContentLoaded', function() {
    const thumbnails = document.querySelectorAll('.message-thumbnail img');
    
    thumbnails.forEach(img => {
        img.addEventListener('error', function() {
            // Replace with a default thumbnail if YouTube thumbnail fails
            this.src = 'data:image/svg+xml,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450">
                    <rect width="800" height="450" fill="#2c5aa0"/>
                    <circle cx="400" cy="225" r="60" fill="rgba(255,255,255,0.8)"/>
                    <polygon points="380,205 380,245 420,225" fill="#2c5aa0"/>
                </svg>
            `);
            this.alt = 'Video thumbnail not available';
        });
    });
});

// Progressive enhancement for message cards
function enhanceMessageCards() {
    const cards = document.querySelectorAll('.message-card');
    
    cards.forEach((card, index) => {
        // Add sequential animation delay
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Add ARIA labels for screen readers
        const title = card.querySelector('h3').textContent;
        const speaker = card.querySelector('.message-speaker').textContent;
        const date = card.querySelector('.message-date').textContent;
        
        card.setAttribute('aria-label', `${title} by ${speaker} on ${date}. Click to play video.`);
        
        // Add loading state
        card.addEventListener('click', function() {
            const playButton = this.querySelector('.play-button i');
            if (playButton) {
                playButton.className = 'fas fa-spinner fa-spin';
                setTimeout(() => {
                    playButton.className = 'fas fa-play';
                }, 1000);
            }
        });
    });
}

// Initialize enhancements when DOM is ready
document.addEventListener('DOMContentLoaded', enhanceMessageCards);

// YouTube Video Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Create modal HTML
    const modalHTML = `
        <div class="youtube-modal" id="youtube-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modal-title">Message Title</h3>
                    <button class="close-modal" onclick="closeVideoModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="video-container">
                    <iframe id="youtube-player" src="" allowfullscreen></iframe>
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click event listeners to message cards
    const messageCards = document.querySelectorAll('.message-card');
    messageCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            
            const videoId = this.dataset.videoId;
            const title = this.querySelector('h3').textContent;
            
            if (videoId) {
                openVideoModal(videoId, title);
            }
        });
        
        // Add keyboard accessibility
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Play video: ${card.querySelector('h3').textContent}`);
    });
    
    // Close modal when clicking outside or pressing Escape
    document.getElementById('youtube-modal').addEventListener('click', function(e) {
        if (e.target === this) closeVideoModal();
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeVideoModal();
    });
});

// Open video modal function
function openVideoModal(videoId, title) {
    const modal = document.getElementById('youtube-modal');
    const modalTitle = document.getElementById('modal-title');
    const player = document.getElementById('youtube-player');
    
    modalTitle.textContent = title;
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close video modal function
function closeVideoModal() {
    const modal = document.getElementById('youtube-modal');
    const player = document.getElementById('youtube-player');
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    player.src = '';
}

// Play YouTube video on card click
document.querySelectorAll('.message-card').forEach(card => {
    card.addEventListener('click', function () {
        const videoId = card.getAttribute('data-video-id');
        const thumbnail = card.querySelector('.message-thumbnail');

        // Replace thumbnail with iframe
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube.com/embed/${videoId}?autoplay=1`);
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('allow', 'autoplay');
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        thumbnail.innerHTML = ''; // Clear existing thumbnail
        thumbnail.appendChild(iframe);
    });
});
