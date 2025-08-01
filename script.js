const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const modelSelect = document.querySelector("#model-select");
const countSelect = document.querySelector("#count-select");
const ratioSelect = document.querySelector("#ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const errorMsg = document.getElementById("errorMsg");

// Hugging face api key
const API_KEY = "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";

const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
})();

const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    // Ensure dimensions are multiples of 16 (AI model requirements)
    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};

const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img" />
    <div class="img-overlay">
        <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
            <i class="fa-solid fa-download"></i>
        </a>
    </div>`;
};

const showErrorState = (imgIndex, errorMessage = "Generation failed") => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if(!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.classList.add("error");
    imgCard.innerHTML = `
        <div class="status-container">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <p class="status-text">${errorMessage}</p>
        </div>
    `;
};

// Sending request to hugging face api to create images
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;

    const {width, height} = getImageDimensions(aspectRatio);
    
    // creating an array of image generation promises
    const imagePromises = Array.from({length: imageCount}, async(_, i) => {
        // Send request to the AI model API
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                    "x-use-cache": "false",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: {width, height},
                }),
            });2000;

            if(!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to generate image");
            }
            
            // convert response to an image and update the image card
            const result = await response.blob();
            updateImageCard(i, URL.createObjectURL(result));
        } catch(error) {
            console.error("Error generating image:", error);
            showErrorState(i, error.message || "Generation failed");
        }
    });
    
    await Promise.allSettled(imagePromises);
};

const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = "";

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                            <div class="status-container">
                                <div class="spinner"></div>
                                <p class="status-text">Generating...</p>
                            </div>
                        </div>`;
    }

    generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// Switch between light and dark themes
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");

    // Ensure the icon exists before changing class
    const icon = themeToggle.querySelector("i");
    if (icon) {
        icon.className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
    }
};

// Handling form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Ensure selects are not null
    if (!modelSelect || !countSelect || !ratioSelect) {
        console.error("Dropdown elements not found!");
        return;
    }

    // Getting form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    // Error handling
    if (!selectedModel) {
        errorMsg.innerText = "Please select a model";
        errorMsg.style.display = "block";
        return;
    }
    if (!aspectRatio) {
        errorMsg.innerText = "Please select an aspect ratio";
        errorMsg.style.display = "block";
        return;
    }
    if (!promptText) {
        errorMsg.innerText = "Prompt text is required";
        errorMsg.style.display = "block";
        return;
    } else {
        errorMsg.innerText = "";
        errorMsg.style.display = "none";
    }

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};

// Filling prompt input with random examples
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});
document.getElementById('year').textContent = new Date().getFullYear();
promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);

// login-sinup
document.getElementById('loginSignupBtn').addEventListener("click", function() {
    window.location.href = "login.html";
  });