// ===================== LOADER =====================
const loader = document.getElementById("loader");
window.addEventListener("load", () => {
    loader.style.opacity = 0;
    setTimeout(() => loader.style.display = "none", 500);
});

// ===================== FADE-IN SECTIONS =====================
const faders = document.querySelectorAll(".fade");

const appearOptions = {
    threshold: 0.2,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver(function(entries, appearOnScroll){
    entries.forEach(entry => {
        if(!entry.isIntersecting) return;
        entry.target.classList.add("appear");
        appearOnScroll.unobserve(entry.target);
    });
}, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});

// ===================== COMPTEURS =====================
const counters = document.querySelectorAll(".counter");
counters.forEach(counter => {
    counter.innerText = "0";

    const updateCounter = () => {
        const target = +counter.getAttribute("data-target");
        const current = +counter.innerText;
        const increment = target / 200; // vitesse animation

        if(current < target){
            counter.innerText = `${Math.ceil(current + increment)}`;
            setTimeout(updateCounter, 10);
        } else {
            counter.innerText = target;
        }
    };

    // lance l'animation seulement quand visible
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, {threshold: 0.5});
    observer.observe(counter);
});

// ===================== BOUTONS INTERACTIFS =====================
const btns = document.querySelectorAll(".btn-primary");
btns.forEach(btn => {
    btn.addEventListener("mouseover", () => btn.style.transform = "scale(1.05)");
    btn.addEventListener("mouseout", () => btn.style.transform = "scale(1)");
});

// ===================== BONUS: SMOOTH SCROLL POUR LES ANCREES =====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e){
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth"
        });
    });
});

