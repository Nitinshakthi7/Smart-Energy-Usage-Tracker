function animateCounter(element, start, end, duration = 2000) {
    if (typeof anime === 'undefined') return;
    
    const obj = { value: start };
    
    anime({
        targets: obj,
        value: end,
        duration: duration,
        easing: 'easeOutQuad',
        round: 1,
        update: function() {
            element.textContent = obj.value;
        }
    });
}

function fadeIn(element, duration = 600) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        opacity: [0, 1],
        duration: duration,
        easing: 'easeOutCubic'
    });
}

function slideUp(element, distance = 30, duration = 600) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        opacity: [0, 1],
        translateY: [distance, 0],
        duration: duration,
        easing: 'easeOutCubic'
    });
}

function scaleIn(element, duration = 400) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: duration,
        easing: 'easeOutElastic'
    });
}

function staggerAnimation(elements, animation = 'fadeIn', delay = 100) {
    if (typeof anime === 'undefined') return;
    
    const animations = {
        fadeIn: {
            opacity: [0, 1],
            translateY: [20, 0]
        },
        slideLeft: {
            opacity: [0, 1],
            translateX: [-50, 0]
        },
        slideRight: {
            opacity: [0, 1],
            translateX: [50, 0]
        },
        scaleIn: {
            opacity: [0, 1],
            scale: [0.8, 1]
        }
    };
    
    anime({
        targets: elements,
        ...animations[animation],
        duration: 600,
        delay: anime.stagger(delay),
        easing: 'easeOutCubic'
    });
}

function pulse(element, scale = 1.05, duration = 1000) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        scale: [1, scale, 1],
        duration: duration,
        loop: true,
        easing: 'easeInOutQuad'
    });
}

function shake(element) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        translateX: [
            { value: -10, duration: 100 },
            { value: 10, duration: 100 },
            { value: -10, duration: 100 },
            { value: 10, duration: 100 },
            { value: 0, duration: 100 }
        ],
        easing: 'easeInOutQuad'
    });
}

function showLoadingAnimation(element) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        rotate: 360,
        duration: 1000,
        loop: true,
        easing: 'linear'
    });
}

function successCheckmark(element) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        scale: [0, 1],
        opacity: [0, 1],
        duration: 600,
        easing: 'easeOutElastic'
    });
}

function flipCard(element, duration = 600) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        rotateY: [0, 180],
        duration: duration,
        easing: 'easeInOutQuad'
    });
}

function animateProgressBar(element, targetWidth, duration = 1000) {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: element,
        width: targetWidth + '%',
        duration: duration,
        easing: 'easeOutCubic'
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        animateCounter,
        fadeIn,
        slideUp,
        scaleIn,
        staggerAnimation,
        pulse,
        shake,
        showLoadingAnimation,
        successCheckmark,
        flipCard,
        animateProgressBar
    };
}