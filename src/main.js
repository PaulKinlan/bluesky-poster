import "./style.css"; // Import CSS for Vite

// DOM Elements
const promptInput = document.getElementById("promptInput");
const generateButton = document.getElementById("generateButton");
const statusArea = document.getElementById("statusArea");
const postsHistoryContainer = document.getElementById("postsHistoryContainer");
const postEntryTemplate = document.getElementById("postEntryTemplate");

// Refinement Modal Elements
const refineOptionsModal = document.getElementById("refineOptionsModal");
const refineToneSelect = document.getElementById("refineTone");
const refineFormatSelect = document.getElementById("refineFormat");
const refineLengthSelect = document.getElementById("refineLength");
const applyRefinementButton = document.getElementById("applyRefinementButton");
const cancelRefinementButton = document.getElementById(
  "cancelRefinementButton"
);

const MAX_CHARS = 300;
let writerAvailable = false;
let rewriterAvailable = false;
const initialContext =
  "Creating a draft for a social media post on Bluesky, with a maximum of 300 characters.";

let currentPostEntryToRefine = null; // To keep track of which post is being refined
let statusTimeout = null; // Variable to hold the timeout ID

// --- Helper Functions ---

function setStatus(message, type = "info", duration = 4000) {
  // Added duration parameter
  if (!statusArea) return;

  // Clear any existing timeout to prevent premature hiding
  if (statusTimeout) {
    clearTimeout(statusTimeout);
  }

  statusArea.textContent = message;
  statusArea.className = `status ${type}`; // Apply type for styling (e.g., error, info)

  if (message) {
    statusArea.style.display = "block";
    // Set a timeout to hide the message
    statusTimeout = setTimeout(() => {
      statusArea.style.display = "none";
      statusTimeout = null; // Reset timeout ID
    }, duration);
  } else {
    // If message is empty, hide immediately
    statusArea.style.display = "none";
    if (statusTimeout) {
      clearTimeout(statusTimeout); // Clear timeout if message is manually cleared
      statusTimeout = null;
    }
  }
}

function updatePostCharCount(postEntry) {
  const outputArea = postEntry.querySelector(".post-text");
  const charCountSpan = postEntry.querySelector(".char-count");
  const refineBtn = postEntry.querySelector(".refine-post-button");
  const shareBtn = postEntry.querySelector(".share-post-button");

  if (!outputArea || !charCountSpan || !refineBtn || !shareBtn) return;

  const currentLength = outputArea.value.length;
  charCountSpan.textContent = `${currentLength} / ${MAX_CHARS}`;
  const isOverLimit = currentLength > MAX_CHARS;
  const isEmpty = currentLength === 0;

  charCountSpan.style.color = isOverLimit ? "red" : "";
  shareBtn.disabled = isOverLimit || isEmpty;
  refineBtn.disabled = isEmpty || !rewriterAvailable;
}

function setLoadingState(isLoading, activeElement = null) {
  generateButton.disabled = isLoading;

  // Disable all refine and share buttons in history
  document
    .querySelectorAll(
      ".post-entry .refine-post-button, .post-entry .share-post-button"
    )
    .forEach((btn) => {
      if (btn !== activeElement) {
        // Don't disable the button that initiated the action if it's a refine button
        btn.disabled = isLoading;
      }
    });

  if (activeElement && activeElement.classList.contains("refine-post-button")) {
    activeElement.disabled = isLoading; // Ensure the initiating refine button is also handled
  }

  // Disable textareas during loading
  document
    .querySelectorAll(".post-entry .post-text")
    .forEach((ta) => (ta.readOnly = isLoading));
  if (promptInput) promptInput.readOnly = isLoading;

  // Handle refine modal buttons
  if (applyRefinementButton) applyRefinementButton.disabled = isLoading;
  if (cancelRefinementButton) cancelRefinementButton.disabled = isLoading;
}

// --- Create Post Entry ---
function createPostEntry(text = "", isLoading = false) {
  if (!postEntryTemplate || !postsHistoryContainer) return null;

  const entryClone = postEntryTemplate.content.cloneNode(true);
  const postEntryDiv = entryClone.querySelector(".post-entry");
  const outputArea = entryClone.querySelector(".post-text");
  const refineBtn = entryClone.querySelector(".refine-post-button");
  const shareBtn = entryClone.querySelector(".share-post-button");

  outputArea.value = text;
  outputArea.readOnly = isLoading;

  updatePostCharCount(postEntryDiv); // Initial character count

  outputArea.addEventListener("input", () => updatePostCharCount(postEntryDiv));

  refineBtn.addEventListener("click", () => {
    currentPostEntryToRefine = postEntryDiv;
    // Populate modal with current post's characteristics if desired, or reset
    // For now, just show the modal with default/previous selections
    refineOptionsModal.style.display = "block";
    // Pre-fill options based on the post being refined or defaults
    // Example: const currentTone = postEntryDiv.dataset.tone || 'formal';
    // refineToneSelect.value = currentTone;
  });

  shareBtn.addEventListener("click", () => {
    const textToShare = outputArea.value;
    if (textToShare.length === 0 || textToShare.length > MAX_CHARS) {
      setStatus("Text is empty or exceeds 300 characters.", "error");
      return;
    }
    const encodedText = encodeURIComponent(textToShare);
    const blueskyUrl = `https://bsky.app/intent/compose?text=${encodedText}`;
    window.open(blueskyUrl, "_blank");
    setStatus("");
  });

  postsHistoryContainer.appendChild(entryClone);
  return postEntryDiv;
}

// --- API Availability Check ---
async function checkApiAvailability() {
  if (!generateButton) return;

  try {
    if (
      typeof Writer !== "undefined" &&
      (await Writer.availability()) !== "unavailable"
    ) {
      writerAvailable = true;
      console.log("Writer API is available.");
    } else {
      setStatus("Writer API is not available on this browser.", "error");
    }
  } catch (error) {
    console.error("Error checking Writer availability:", error);
    setStatus("Could not check Writer API availability.", "error");
  }

  try {
    if (
      typeof Rewriter !== "undefined" &&
      (await Rewriter.availability()) !== "unavailable"
    ) {
      rewriterAvailable = true;
      console.log("Rewriter API is available.");
    } else {
      setStatus(
        (statusArea.textContent &&
        statusArea.textContent !==
          "Writer API is not available on this browser."
          ? statusArea.textContent + " "
          : "") + "Rewriter API is not available.",
        "error"
      );
    }
  } catch (error) {
    console.error("Error checking Rewriter availability:", error);
    setStatus(
      (statusArea.textContent ? statusArea.textContent + " " : "") +
        "Could not check Rewriter API availability.",
      "error"
    );
  }

  generateButton.disabled = !writerAvailable;
  // Individual post refine buttons are handled by updatePostCharCount
  // and their initial state when created.
}

// --- Event Listeners ---

if (generateButton) {
  generateButton.addEventListener("click", async () => {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      setStatus("Please enter a prompt.", "error");
      return;
    }
    if (!writerAvailable) {
      setStatus("Writer API is not available.", "error");
      return;
    }

    setStatus("Generating draft...", "info");
    setLoadingState(true);
    const newPostEntry = createPostEntry("", true); // Create empty, loading post
    if (!newPostEntry) {
      setStatus("Failed to create new post area.", "error");
      setLoadingState(false);
      return;
    }
    const outputArea = newPostEntry.querySelector(".post-text");

    try {
      const writer = await Writer.create({
        tone: "formal",
        format: "plain-text",
        length: "short",
      });
      const result = await writer.writeStreaming(prompt, {
        context: initialContext,
      });
      let fullText = "";
      for await (const chunk of result) {
        fullText += chunk;
        outputArea.value = fullText; // Stream to the new post's textarea
        updatePostCharCount(newPostEntry); // Update char count as it streams
      }
      outputArea.readOnly = false;
      // Store generation parameters if needed for future refinements
      // newPostEntry.dataset.tone = "default"; // Example
      setStatus("Draft generated successfully.", "info");
    } catch (error) {
      console.error("Error generating draft:", error);
      setStatus(`Error generating draft: ${error.message}`, "error");
      if (error.name === "QuotaExceededError") {
        setStatus(
          `Error: Prompt is too long. Requested ${error.requested} tokens, quota is ${error.quota}.`,
          "error"
        );
      }
      // Remove the failed post entry or mark it as error
      newPostEntry.remove();
    } finally {
      setLoadingState(false);
      if (outputArea) outputArea.readOnly = false; // Ensure it's editable
      updatePostCharCount(newPostEntry); // Final update
    }
  });
}

if (applyRefinementButton) {
  applyRefinementButton.addEventListener("click", async () => {
    if (!currentPostEntryToRefine || !rewriterAvailable) {
      setStatus(
        "Cannot refine: No post selected or Rewriter API unavailable.",
        "error"
      );
      refineOptionsModal.style.display = "none";
      return;
    }

    const originalText =
      currentPostEntryToRefine.querySelector(".post-text").value;
    const tone = refineToneSelect.value;
    const format = refineFormatSelect.value;
    const length = refineLengthSelect.value;

    setStatus("Refining text...", "info");
    setLoadingState(
      true,
      currentPostEntryToRefine.querySelector(".refine-post-button")
    );
    refineOptionsModal.style.display = "none";

    // Create a new post entry for the refined text, below the current one
    const refinedPostEntry = createPostEntry("", true); // Create empty, loading post
    if (!refinedPostEntry) {
      setStatus("Failed to create new post area for refinement.", "error");
      setLoadingState(
        false,
        currentPostEntryToRefine.querySelector(".refine-post-button")
      );
      return;
    }
    const refinedOutputArea = refinedPostEntry.querySelector(".post-text");
    // Insert the new post entry after the one being refined
    currentPostEntryToRefine.parentNode.insertBefore(
      refinedPostEntry,
      currentPostEntryToRefine.nextSibling
    );

    try {
      const rewriter = await Rewriter.create({ tone, format, length });
      const result = await rewriter.rewriteStreaming(originalText, {
        context: initialContext,
      });
      let fullRefinedText = "";
      for await (const chunk of result) {
        fullRefinedText += chunk;
        refinedOutputArea.value = fullRefinedText;
        updatePostCharCount(refinedPostEntry);
      }
      refinedOutputArea.readOnly = false;
      // Store refinement parameters
      // refinedPostEntry.dataset.tone = tone; // etc.
      setStatus("Text refined successfully.", "info");
    } catch (error) {
      console.error("Error refining text:", error);
      setStatus(`Error refining text: ${error.message}`, "error");
      if (error.name === "QuotaExceededError") {
        setStatus(
          `Error: Text is too long to refine. Requested ${error.requested} tokens, quota is ${error.quota}.`,
          "error"
        );
      }
      refinedPostEntry.remove(); // Remove the failed refinement entry
    } finally {
      setLoadingState(
        false,
        currentPostEntryToRefine.querySelector(".refine-post-button")
      );
      if (refinedOutputArea) refinedOutputArea.readOnly = false;
      updatePostCharCount(refinedPostEntry);
      currentPostEntryToRefine = null; // Reset
    }
  });
}

if (cancelRefinementButton) {
  cancelRefinementButton.addEventListener("click", () => {
    refineOptionsModal.style.display = "none";
    currentPostEntryToRefine = null; // Reset
    setStatus("");
  });
}

// --- Initial Setup ---
checkApiAvailability();
// No initial global char count update needed as posts are dynamic.
