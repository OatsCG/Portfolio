// Get elements
const modalOverlay = document.getElementById("modalOverlay");
const closeButton = document.getElementById("closeButton");

// Function to open the modal with custom content
function openModal(headerText, subheaderText, bodyText) {
    // Update modal content with HTML support
    document.querySelector(".modal-header").innerHTML = headerText;
    document.querySelector(".subheader-text").innerHTML = subheaderText;
    document.querySelector(".modal-body").innerHTML = bodyText;

    // Show modal overlay and apply blur and dark background
    modalOverlay.style.display = "flex";
    setTimeout(() => {
        modalOverlay.style.background = "rgba(0, 0, 0, 0.7)"; // Dark background
        modalOverlay.style.backdropFilter = "blur(4px)"; // Apply blur
    }, 0);

    // Start modal content fade-in animation
    const modalContent = document.querySelector(".modal-content");
    modalContent.style.animation = "fadeInScale 0.3s ease forwards";
}

// Function to close the modal with fade-out and blur-out effects
function closeModal() {
    const modalContent = document.querySelector(".modal-content");
    modalContent.style.animation = "fadeOutScale 0.3s ease forwards";

    // Remove blur and dark background smoothly
    modalOverlay.style.background = "rgba(0, 0, 0, 0)"; // Reset background
    modalOverlay.style.backdropFilter = "blur(0px)"; // Remove blur

    // Wait for the transition to complete before hiding the overlay
    setTimeout(() => {
        modalOverlay.style.display = "none";
    }, 300); // Match this duration to the fadeOutScale animation time
}

// Close modal when the "X" button is clicked
closeButton.addEventListener("click", closeModal);

// Close modal when clicking outside of the modal content
modalOverlay.addEventListener("click", (event) => {
    if (event.target === modalOverlay) {
        closeModal();
    }
});
