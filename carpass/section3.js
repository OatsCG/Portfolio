document.addEventListener("DOMContentLoaded", () => {
    const scrollContainer = document.querySelector(".section-3-scroll-container");
    const cells = document.querySelectorAll(".section-3-cell");
    const dotsContainer = document.querySelector(".section-3-dots");
    const prevArrow = document.getElementById("prevArrow3");
    const nextArrow = document.getElementById("nextArrow3");

    let currentIndex = 0;

    // Update dots based on the current index
    function updateDots3() {
        dots.forEach((dot, index) => {
            dot.classList.toggle("active", index === currentIndex);
        });
    }

    // Scroll to a specific cell along the x-axis only
    function scrollToIndex3(index) {
        cells[index].scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
        currentIndex = index;
        updateDots3();
    }

    // Create dot indicators
    cells.forEach((_, index) => {
        const dot = document.createElement("div");
        dot.classList.add("section-3-dot");
        if (index === currentIndex) dot.classList.add("active");
        dotsContainer.appendChild(dot);

        // Scroll to the respective cell when a dot is clicked
        dot.addEventListener("click", () => {
            scrollToIndex3(index);
        });
    });

    const dots = document.querySelectorAll(".section-3-dot");

    // Arrow navigation
    prevArrow.addEventListener("click", () => {
        if (currentIndex > 0) {
            scrollToIndex3(currentIndex - 1);
        }
    });

    nextArrow.addEventListener("click", () => {
        if (currentIndex < cells.length - 1) {
            scrollToIndex3(currentIndex + 1);
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
                updateDots3();
            }
        });
    });

    // Initialize image animations
    const carpass_1 = document.getElementById("carpass_1");
    animateTransform(carpass_1, () => ((scrollContainer.offsetWidth - carpass_1.getBoundingClientRect().width) / 2) - carpass_1.getBoundingClientRect().x + 200, 0, 1.15, 0.0002, 'scale', true, true);
    const carpass_2a = document.getElementById("carpass_2a");
    animateProperty(carpass_2a, () => (scrollContainer.offsetWidth / 2) - carpass_2a.getBoundingClientRect().x, 0, 200, 0.2, 'paddingTop', true);
    const carpass_2b = document.getElementById("carpass_2b");
    animateProperty(carpass_2b, () => (scrollContainer.offsetWidth / 2) - carpass_2b.getBoundingClientRect().x, 0, 200, 0.2, 'paddingTop', false);
    const carpass_3 = document.getElementById("carpass_3");
    animateTransform(carpass_3, () => ((scrollContainer.offsetWidth - carpass_3.getBoundingClientRect().width) / 2) - carpass_3.getBoundingClientRect().x - 400, 0, 1.1, 0.0001, 'scale', true, true);
    const carpass_4 = document.getElementById("carpass_4");
    animateTransform(carpass_4, () => ((scrollContainer.offsetWidth - carpass_4.getBoundingClientRect().width) / 2) - carpass_4.getBoundingClientRect().x - 400, 0, 1.1, 0.0001, 'scale', true, true);

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