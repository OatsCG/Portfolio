document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".nav-button");
    const sections = {
        "home-section": document.querySelector(".home-section"),
        "openmusic-section": document.querySelector(".openmusic-section"),
        "carpass-section": document.querySelector(".carpass-section"),
        "unisports-section": document.querySelector(".unisports-section"),
    };

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const section = sections[button.getAttribute("data-section")];

            // Scroll to section with padding
            const yOffset = -50; // Adjust for 50px padding
            const yPosition = section.getBoundingClientRect().top + window.pageYOffset + yOffset;

            window.scrollTo({
                top: yPosition,
                behavior: "smooth"
            });
        });
    });

    let currentAnchor = null;

    // Define the functions
    function runFunctionForSection(sectionKey) {
        console.log(`Active section: ${sectionKey}`);
        if (sectionKey == "home-section") {
            setFlowMode()
        } else if (sectionKey == "openmusic-section") {
            setWaveMode()
        } else if (sectionKey == "carpass-section") {
            setClockwiseCircleMode()
        } else if (sectionKey == "unisports-section") {
            setBlueFlowMode()
        }
    }

    function runFunctionWhenOutOfAllSections() {
        setFlowMode()
    }

    function updateSectionMode() {
        let newAnchor = null;

        // Check if any section is in view
        for (const [key, section] of Object.entries(sections)) {
            const rect = section.getBoundingClientRect();
            if (rect.top <= 150 && rect.bottom >= 150) {
                newAnchor = key;
                break;
            }
        }

        // Run the function only if the anchor has changed
        if (newAnchor !== currentAnchor) {
            // If we are scrolling out of all sections
            if (newAnchor === null) {
                runFunctionWhenOutOfAllSections();
            } else {
                // If we have a new section in view
                runFunctionForSection(newAnchor);
            }

            // Update button classes
            buttons.forEach(button => {
                button.classList.toggle("active", button.getAttribute("data-section") === newAnchor);
            });

            // Update the current anchor
            currentAnchor = newAnchor;
        }
    }

    window.addEventListener("scroll", updateSectionMode);

    // Set initial mode based on current scroll position
    updateSectionMode();

    // Export function to reapply current mode (used on resize)
    window.reapplyCurrentSectionMode = updateSectionMode;
});
