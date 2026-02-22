document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".nav-button");
    const sections = {
        "section-1": document.querySelector(".section-1"),
        "section-2": document.querySelector(".section-2"),
        "section-3": document.querySelector(".section-3"),
        "section-4": document.querySelector(".section-4"),
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

    window.addEventListener("scroll", () => {
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
    });

    // Define the functions
    function runFunctionForSection(sectionKey) {
        // Implement your section-specific logic here
        console.log(`Active section: ${sectionKey}`);
        if (sectionKey == "section-1") {
            // document.getElementById('particleCanvas').style.filter = 'drop-shadow(0px 0px 50px #fff) drop-shadow(0px 0px 20px #fff)';
            setFlowMode()
        } else if (sectionKey == "section-2") {
            // document.getElementById('particleCanvas').style.filter = 'drop-shadow(0px 0px 50px #6673ff) drop-shadow(0px 0px 20px #6673ff)';
            setWaveMode()
        } else if (sectionKey == "section-3") {
            // document.getElementById('particleCanvas').style.filter = 'drop-shadow(0px 0px 50px #fff) drop-shadow(0px 0px 20px #fff)';
            setClockwiseCircleMode()
        } else if (sectionKey == "section-4") {
            // document.getElementById('particleCanvas').style.filter = 'drop-shadow(0px 0px 50px #fff) drop-shadow(0px 0px 20px #fff)';
            setBlueFlowMode()
        }
    }

    function runFunctionWhenOutOfAllSections() {
        setFlowMode()
    }

});


function toggleAnimation() {
    const canvas = document.getElementById("particleCanvas");

    if (SIM.is_animation_enabled === true) {
        // Animate canvas blackout
        canvas.style.animation = "fadeOut 0.5s ease-in forwards";

        // Disable animation after the fade-out completes
        canvas.addEventListener('animationend', () => {
            SIM.is_animation_enabled = false;
            canvas.style.opacity = 0;
        }, {
            once: true
        });

    } else {
        SIM.is_animation_enabled = true;
        window.resizeCanvas()
        window.animate();
        // Animate canvas in
        canvas.style.opacity = 1;
        canvas.style.animation = "fadeIn 0.5s ease-in forwards";
    }
}