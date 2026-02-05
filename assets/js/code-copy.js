/**
 * Add copy-to-clipboard button and language badge to code blocks
 */
document.addEventListener("DOMContentLoaded", () => {
  const highlightBlocks = document.querySelectorAll(".highlight");

  highlightBlocks.forEach((block) => {
    // Get language from data-lang attribute
    const code = block.querySelector("code");
    const lang = code?.dataset.lang || "code";

    // Create wrapper for button and badge
    const wrapper = document.createElement("div");
    wrapper.className = "code-block-wrapper";
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);

    // Add language badge
    const badge = document.createElement("span");
    badge.className = "code-lang-badge";
    badge.textContent = lang.toUpperCase();
    wrapper.appendChild(badge);

    // Add copy button
    const copyBtn = document.createElement("button");
    copyBtn.className = "code-copy-btn";
    copyBtn.setAttribute("aria-label", "Copy code to clipboard");
    copyBtn.setAttribute("title", "Copy code");
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
      </svg>
    `;

    // Copy functionality
    copyBtn.addEventListener("click", async () => {
      try {
        // Extract only code content, excluding line numbers
        const codeSection =
          block.querySelector(".code") || block.querySelector("pre");
        const codeText = codeSection?.textContent || code?.textContent || "";
        await navigator.clipboard.writeText(codeText.trim());

        // Visual feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        `;
        copyBtn.classList.add("copied");

        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.classList.remove("copied");
        }, 2000);
      } catch (err) {
        console.error("Failed to copy code:", err);
      }
    });

    wrapper.appendChild(copyBtn);
  });
});
