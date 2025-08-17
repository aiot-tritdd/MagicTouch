const WRAPPER_ID = 'magic-touch-wrapper';
const GHOST_ID = 'magic-touch-ghost';
let panelWrapper = null;
let iframe = null;
let ghost = null;
let resizeHandle = null;

// State management to prevent conflicts
let state = {
    isDragging: false,
    isResizing: false,
    offsetX: 0,
    offsetY: 0,
};

function createPanel() {
    if (document.getElementById(WRAPPER_ID)) return;
    // Only create floating panel if we're in desktop mode
    if (window.innerWidth <= 768) {
        console.log('Mobile mode - not creating floating panel');
        return;
    }
    // Create the panel wrapper
    panelWrapper = document.createElement('div');
    panelWrapper.id = WRAPPER_ID;
    panelWrapper.style.position = 'fixed';
    panelWrapper.style.top = '20px';
    panelWrapper.style.right = '20px';
    panelWrapper.style.width = '520px';
    panelWrapper.style.height = '800px';
    panelWrapper.style.zIndex = '99999999';
    panelWrapper.style.backgroundColor = 'white';
    panelWrapper.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
    panelWrapper.style.borderRadius = '12px';
    panelWrapper.style.overflow = 'hidden';

    // Create the iframe that contains our panel content
    iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('ui/panel/panel.html');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    // Create a dedicated resize handle element - this makes it MUCH easier to grab
    resizeHandle = document.createElement('div');
    resizeHandle.id = 'magic-touch-resize-handle';
    resizeHandle.style.position = 'absolute';
    resizeHandle.style.bottom = '0';
    resizeHandle.style.right = '0';
    resizeHandle.style.width = '20px';
    resizeHandle.style.height = '20px';
    resizeHandle.style.cursor = 'se-resize';
    resizeHandle.style.zIndex = '100';
    resizeHandle.style.backgroundColor = 'transparent'; // Make it clickable

    // Add a visual indicator for the resize handle
    resizeHandle.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 10 10" style="position:absolute;bottom:3px;right:3px">
        <path d="M0,10 L10,0 L10,10 Z" fill="#888"/>
      </svg>
    `;

    panelWrapper.appendChild(iframe);
    panelWrapper.appendChild(resizeHandle);
    document.body.appendChild(panelWrapper);

    // Debug click on resize handle
    resizeHandle.addEventListener('mousedown', function (e) {
        // Stop event propagation to prevent other handlers from stealing it
        e.stopPropagation();
        e.preventDefault();
        onResizeStart(e);
    });
}

function togglePanel() {
    if (!panelWrapper) createPanel();
    else panelWrapper.style.display = (panelWrapper.style.display === 'none') ? 'flex' : 'none';
}

// Replace only the ghost creation part in onResizeStart function

// Replace only the ghost creation part in onResizeStart function

function onResizeStart(e) {
    console.log("Starting resize");

    e.stopPropagation();
    e.preventDefault();

    state.isResizing = true;

    // Get initial panel position and size
    const initialRect = panelWrapper.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = initialRect.width;
    const startHeight = initialRect.height;

    // Create visible ghost element with VERY obvious styling
    ghost = document.createElement('div');
    ghost.id = GHOST_ID;
    ghost.style.cssText = `
        position: fixed !important;
        left: ${initialRect.left}px !important;
        top: ${initialRect.top}px !important;
        width: ${startWidth}px !important;
        height: ${startHeight}px !important;
        border: 4px dashed #ff0000 !important;
        background-color: rgba(255, 0, 0, 0.3) !important;
        border-radius: 12px !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.5) !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;

    // Double-check that ghost is added
    document.body.appendChild(ghost);

    // Hide the original panel completely during resize
    panelWrapper.style.visibility = 'hidden';
    document.body.style.userSelect = 'none';

    function handleResize(e) {
        if (!state.isResizing || !ghost) return;

        // Calculate new dimensions based on mouse movement
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const newWidth = Math.max(startWidth + deltaX, 300);
        const newHeight = Math.max(startHeight + deltaY, 200);

        // Update ghost size with !important to force visibility
        ghost.style.width = newWidth + 'px';
        ghost.style.height = newHeight + 'px';
    }

    function finishResize() {
        if (!state.isResizing) return;


        // Get final ghost dimensions
        const finalWidth = parseInt(ghost.style.width);
        const finalHeight = parseInt(ghost.style.height);

        // Apply new size to the actual panel
        panelWrapper.style.width = finalWidth + 'px';
        panelWrapper.style.height = finalHeight + 'px';

        // Show the panel again with new size
        panelWrapper.style.visibility = 'visible';

        // Remove ghost
        if (ghost && ghost.parentNode) {
            document.body.removeChild(ghost);
            ghost = null;
        }

        // Cleanup
        document.body.style.userSelect = '';
        state.isResizing = false;

        // Remove listeners
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', finishResize);

    }

    // Add listeners for mouse movement and release
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', finishResize);
}

// --- DRAG LOGIC --

function onDragStart(e) {
    if (state.isResizing) return; // Don't start dragging if already resizing

    state.isDragging = true;
    const rect = panelWrapper.getBoundingClientRect();
    state.offsetX = e.clientX - rect.left;
    state.offsetY = e.clientY - rect.top;

    // Disable pointer events on iframe during drag
    iframe.style.pointerEvents = 'none';

    // Disable text selection
    const originalUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    function onDragMove(e) {
        if (!state.isDragging) return;
        panelWrapper.style.left = `${e.clientX - state.offsetX}px`;
        panelWrapper.style.top = `${e.clientY - state.offsetY}px`;
    }

    function onDragEnd() {
        state.isDragging = false;
        iframe.style.pointerEvents = 'auto';
        document.body.style.userSelect = originalUserSelect;
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
    }

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
}

// --- Message Listeners ---
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "TOGGLE_PANEL") togglePanel();
});

// Listen for toggle messages from background script
window.addEventListener('message', (event) => {
    if (event.data.type === 'TOGGLE_PANEL') {
        togglePanel();
    } else if (event.data.type === 'drag-start') {
        const iframeRect = iframe.getBoundingClientRect();
        const clientX = event.data.event.clientX + iframeRect.left;
        const clientY = event.data.event.clientY + iframeRect.top;
        
        onDragStart({
            target: iframe,
            clientX: clientX,
            clientY: clientY,
            preventDefault: () => {},
            stopPropagation: () => {}
        });
    }
});
