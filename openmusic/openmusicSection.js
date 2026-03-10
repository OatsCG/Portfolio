document.addEventListener("DOMContentLoaded", () => {
    // Isolate to this carousel using closest()
    const carouselSection = document.querySelector(".openmusic-section");
    const scrollContainer = carouselSection.querySelector(".openmusic-scroll-container");
    const cells = carouselSection.querySelectorAll(".openmusic-cell");
    const dotsContainer = carouselSection.querySelector(".openmusic-dots");
    const prevArrow = carouselSection.querySelector("#prevArrowOpenmusic");
    const nextArrow = carouselSection.querySelector("#nextArrowOpenmusic");

    let currentIndex = 0;

    // Update dots based on the current index
    function updateDots() {
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    // Scroll to a specific cell along the x-axis only
    function scrollToIndex(index) {
        cells[index].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        currentIndex = index;
        updateDots();
    }

    // Create dot indicators
    cells.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("carousel-dot");
        if (index === currentIndex) dot.classList.add("active");
        dotsContainer.appendChild(dot);

        // Scroll to the respective cell when a dot is clicked
        dot.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            scrollToIndex(index);
        });
    });

    const dots = carouselSection.querySelectorAll(".carousel-dot");

    // Arrow navigation
    prevArrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex > 0) {
            scrollToIndex(currentIndex - 1);
        }
    });

    nextArrow.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (currentIndex < cells.length - 1) {
            scrollToIndex(currentIndex + 1);
        }
    });

    // Listen to scroll event for scaling effect
    scrollContainer.addEventListener("scroll", () => {
        // Update current index for dot indicator based on the center position
        const center = scrollContainer.scrollLeft + scrollContainer.offsetWidth / 2;
        cells.forEach((cell, index) => {
            const cellCenter = cell.offsetLeft + cell.offsetWidth / 2;
            if (Math.abs(center - cellCenter) < cell.offsetWidth / 2) {
                currentIndex = index;
                updateDots();
            }
        });
    });

    // Initialize image animations
    const openmusic_1 = document.getElementById("openmusic_1");
    animateTransform(openmusic_1, () => ((scrollContainer.offsetWidth - openmusic_1.getBoundingClientRect().width) / 2) - openmusic_1.getBoundingClientRect().x, 0, 1.15, 0.0002, 'scale', true, true);
    const openmusic_2 = document.getElementById("openmusic_2");
    animateProperty(openmusic_2, () => (scrollContainer.offsetWidth / 2) - openmusic_2.getBoundingClientRect().x, 0, 200, 0.2, 'paddingTop', true);
    const c = 200
    var g = (x) => x + (c * Math.sin(-x / c)) * (Math.pow(2, -Math.abs(Math.pow(x / (Math.PI * c), 20))))
    const openmusic_3a = document.getElementById("openmusic_3a");
    animateTransform(openmusic_3a, () => g(((scrollContainer.offsetWidth - openmusic_3a.getBoundingClientRect().width) / 2) - openmusic_3a.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_3b = document.getElementById("openmusic_3b");
    animateTransform(openmusic_3b, () => g(((scrollContainer.offsetWidth - openmusic_3b.getBoundingClientRect().width) / 2) - openmusic_3b.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_3c = document.getElementById("openmusic_3c");
    animateTransform(openmusic_3c, () => g(((scrollContainer.offsetWidth - openmusic_3c.getBoundingClientRect().width) / 2) - openmusic_3c.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_3d = document.getElementById("openmusic_3d");
    animateTransform(openmusic_3d, () => g(((scrollContainer.offsetWidth - openmusic_3d.getBoundingClientRect().width) / 2) - openmusic_3d.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_3e = document.getElementById("openmusic_3e");
    animateTransform(openmusic_3e, () => g(((scrollContainer.offsetWidth - openmusic_3e.getBoundingClientRect().width) / 2) - openmusic_3e.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_3f = document.getElementById("openmusic_3f");
    animateTransform(openmusic_3f, () => g(((scrollContainer.offsetWidth - openmusic_3f.getBoundingClientRect().width) / 2) - openmusic_3f.getBoundingClientRect().x), 0, 1.15, 0.0004, 'scale', true, true);
    const openmusic_6 = document.getElementById("openmusic_6");
    animateTransform(openmusic_6, () => ((scrollContainer.offsetWidth - openmusic_6.getBoundingClientRect().width) / 2) - openmusic_6.getBoundingClientRect().x - 400, 0, 1.1, 0.0001, 'scale', true, true);

    // Play button
    const video1 = document.getElementById('openmusic_4a');
    const video2 = document.getElementById('openmusic_4b');
    const playButton = document.getElementById('playButton');

    // Function to update button icon based on video state
    const updateButtonIcon = () => {
        if (video1.paused) {
            playButton.src = "openmusic/playbutton.webp";
        } else {
            playButton.src = "openmusic/pausebutton.webp";
        }
    };

    // Play or pause the video when the button is clicked
    playButton.addEventListener('click', () => {
        if (video1.paused) {
            video1.play();
            video2.play();
        } else {
            video1.pause();
            video2.pause();
        }
        updateButtonIcon();
    });

    // Change to "replay" icon when the video ends
    video1.addEventListener('ended', () => {
        playButton.src = "openmusic/replaybutton.webp";
    });

    // Update the button to "pause" when video is playing and "play" when paused
    video1.addEventListener('play', updateButtonIcon);
    video1.addEventListener('pause', updateButtonIcon);
    video2.addEventListener('play', updateButtonIcon);
    video2.addEventListener('pause', updateButtonIcon);
});

function animateProperty(targetElement, propertyGetter, inputValue, targetValue, speed, targetCssProperty, reverse = false, absolute = false, percented = false) {
    function updateProperty() {
        let difference = propertyGetter() - inputValue;
        if (absolute) {
            difference = Math.abs(difference);
        }

        // Calculate output based on difference, speed, and reverse flag
        const outputValue = reverse ?
            targetValue - difference * speed :
            targetValue + difference * speed;

        targetElement.style[targetCssProperty] = outputValue + (targetCssProperty === 'opacity' ? '' : (percented ? '%' : 'px'));

        requestAnimationFrame(updateProperty);
    }

    updateProperty();
}

function animateTransform(targetElement, propertyGetter, inputValue, targetValue, speed, transformType, reverse = false, absolute = false) {
    function updateTransform() {
        let difference = propertyGetter() - inputValue;
        if (absolute) {
            difference = Math.abs(difference);
        }

        // Calculate the transform value based on difference, speed, and reverse flag
        const transformValue = reverse ?
            targetValue - difference * speed :
            targetValue + difference * speed;

        // Set the transform property dynamically
        targetElement.style.transform = `${transformType}(${transformValue})`;

        requestAnimationFrame(updateTransform);
    }
    updateTransform();
}
