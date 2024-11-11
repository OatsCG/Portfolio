document.addEventListener("DOMContentLoaded", () => {
    const scrollContainer = document.querySelector(".section-4-scroll-container");
    const cells = document.querySelectorAll(".section-4-cell");
    const dotsContainer = document.querySelector(".section-4-dots");
    const prevArrow = document.getElementById("prevArrow4");
    const nextArrow = document.getElementById("nextArrow4");

    let currentIndex = 0;

    // Update dots based on the current index
    function updateDots4() {
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    // Scroll to a specific cell along the x-axis only
    function scrollToIndex4(index) {
        cells[index].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        currentIndex = index;
        updateDots4();
    }

    // Create dot indicators
    cells.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("section-4-dot");
        if (index === currentIndex) dot.classList.add("active");
        dotsContainer.appendChild(dot);

        // Scroll to the respective cell when a dot is clicked
        dot.addEventListener("click", () => {
            scrollToIndex4(index);
        });
    });

    const dots = document.querySelectorAll(".section-4-dot");

    // Arrow navigation
    prevArrow.addEventListener("click", () => {
        if (currentIndex > 0) {
            scrollToIndex4(currentIndex - 1);
        }
    });

    nextArrow.addEventListener("click", () => {
        if (currentIndex < cells.length - 1) {
            scrollToIndex4(currentIndex + 1);
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
                updateDots4();
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