document.addEventListener("DOMContentLoaded", () => {
    initNavbar();
    initMobileMenu();
    initLanguageSwitcher();
    initHeroSlider();
    initRevealAnimations();
    initVideoModal();
});

function initNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const update = () => {
        navbar.classList.toggle("scrolled", window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
}

function initMobileMenu() {
    const button = document.querySelector(".mobile-menu");
    const menu = document.querySelector(".nav-menu");
    if (!button || !menu) return;

    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute("aria-label", "Open navigation menu");
    button.setAttribute("aria-expanded", "false");

    const spans = button.querySelectorAll("span");
    const setOpen = (isOpen) => {
        menu.classList.toggle("active", isOpen);
        button.classList.toggle("active", isOpen);
        button.setAttribute("aria-expanded", String(isOpen));
        if (spans[0]) spans[0].style.transform = isOpen ? "translateY(7px) rotate(45deg)" : "";
        if (spans[1]) spans[1].style.opacity = isOpen ? "0" : "";
        if (spans[2]) spans[2].style.transform = isOpen ? "translateY(-7px) rotate(-45deg)" : "";
    };

    const toggle = () => setOpen(!menu.classList.contains("active"));

    button.addEventListener("click", toggle);
    button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
        }
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setOpen(false));
    });
}

function initLanguageSwitcher() {
    const toggle = document.getElementById("languageToggle");
    const menu = document.getElementById("languageMenu");
    if (!toggle || !menu) return;

    toggle.setAttribute("aria-haspopup", "true");
    toggle.setAttribute("aria-expanded", "false");

    const close = () => {
        menu.classList.remove("active");
        toggle.setAttribute("aria-expanded", "false");
    };

    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        const isOpen = !menu.classList.contains("active");
        menu.classList.toggle("active", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
        if (!toggle.contains(event.target) && !menu.contains(event.target)) {
            close();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
}

function initHeroSlider() {
    const slides = Array.from(document.querySelectorAll(".hero-slide"));
    const dots = Array.from(document.querySelectorAll(".hero-dot"));
    if (!slides.length) return;

    let current = slides.findIndex((slide) => slide.classList.contains("active"));
    if (current < 0) current = 0;
    let timer;

    const show = (index) => {
        current = (index + slides.length) % slides.length;
        slides.forEach((slide, slideIndex) => {
            slide.classList.toggle("active", slideIndex === current);
        });
        dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("active", dotIndex === current);
        });
    };

    const start = () => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        timer = window.setInterval(() => show(current + 1), 6500);
    };

    const restart = () => {
        window.clearInterval(timer);
        start();
    };

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            show(index);
            restart();
        });
    });

    window.currentSlide = (number) => {
        show(number - 1);
        restart();
    };

    show(current);
    start();
}

function initRevealAnimations() {
    const elements = document.querySelectorAll(".fade-in");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
        elements.forEach((element) => element.classList.add("visible"));
        return;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((element) => observer.observe(element));
}

function initVideoModal() {
    const cards = document.querySelectorAll(".message-card[data-video-id]");
    if (!cards.length) return;

    const modal = document.createElement("div");
    modal.className = "youtube-modal";
    modal.innerHTML = `
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-header">
                <h3 id="modal-title"></h3>
                <button class="close-modal" type="button" aria-label="Close video">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="video-container">
                <iframe id="youtube-player" src="" title="Sermon video" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const title = modal.querySelector("#modal-title");
    const player = modal.querySelector("#youtube-player");
    const closeButton = modal.querySelector(".close-modal");
    let activeTrigger = null;

    const close = () => {
        modal.classList.remove("active");
        player.src = "";
        document.body.style.overflow = "";
        if (activeTrigger) activeTrigger.focus();
    };

    cards.forEach((card) => {
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");

        const open = () => {
            activeTrigger = card;
            const videoId = card.dataset.videoId;
            title.textContent = card.querySelector("h3")?.textContent || "Message";
            player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
            modal.classList.add("active");
            document.body.style.overflow = "hidden";
            closeButton.focus();
        };

        card.addEventListener("click", open);
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });
    });

    closeButton.addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) close();
    });
}
