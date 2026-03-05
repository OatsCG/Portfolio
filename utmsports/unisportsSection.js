document.addEventListener("DOMContentLoaded", () => {
    // Isolate to this carousel using closest()
    const carouselSection = document.querySelector(".unisports-section");
    const scrollContainer = carouselSection.querySelector(".unisports-scroll-container");
    const cells = carouselSection.querySelectorAll(".unisports-cell");
    const dotsContainer = carouselSection.querySelector(".unisports-dots");
    const prevArrow = carouselSection.querySelector("#prevArrowUnisports");
    const nextArrow = carouselSection.querySelector("#nextArrowUnisports");

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
    const utmsports_1 = document.getElementById("utmsports_1");
    animateTransform(utmsports_1, () => ((scrollContainer.offsetWidth - utmsports_1.getBoundingClientRect().width) / 2) - utmsports_1.getBoundingClientRect().x + 200, 0, 1.15, 0.0002, 'scale', true, true);
    const utmsports_2 = document.getElementById("utmsports_2");
    animateProperty(utmsports_2, () => (scrollContainer.offsetWidth / 2) - utmsports_2.getBoundingClientRect().x, 0, 200, 0.2, 'paddingTop', true);
    const utmsports_4 = document.getElementById("utmsports_4");
    animateProperty(utmsports_4, () => (scrollContainer.offsetWidth / 2) - utmsports_4.getBoundingClientRect().x, 0, 200, 0.2, 'paddingTop', false);
    const utmsports_5 = document.getElementById("utmsports_5");
    animateTransform(utmsports_5, () => ((scrollContainer.offsetWidth - utmsports_5.getBoundingClientRect().width) / 2) - utmsports_5.getBoundingClientRect().x - 400, 0, 1.1, 0.0001, 'scale', true, true);
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
