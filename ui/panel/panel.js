document.addEventListener('DOMContentLoaded', async () => {
    const statusEl = document.getElementById('status');
    const parseButton = document.getElementById('parseButton');
    const resultBox = document.getElementById('resultBox');

    try {
        statusEl.textContent = 'Getting tab info...';

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.url?.startsWith('http')) {
            statusEl.textContent = 'Cannot run on this page.';
            return;
        }

        statusEl.textContent = 'Checking for scraper...';

        const domain = new URL(tab.url).hostname;
        const scraperKey = domain.replace(/[.\-]/g, '_');
        const scraperFile = `scrapers/${scraperKey}.js`;

        console.log('Domain:', domain);
        console.log('Scraper key:', scraperKey);
        console.log('Scraper file:', scraperFile);

        // Check if the scraper file is packaged with the extension
        try {
            const response = await fetch(chrome.runtime.getURL(scraperFile));
            if (!response.ok) throw new Error();
            statusEl.textContent = `✅ Scraper found: ${scraperKey}`;
            parseButton.disabled = false;
        } catch {
            statusEl.textContent = `❌ Scraper not found: ${scraperKey}`;
            resultBox.textContent = `Build and copy "${scraperKey}.js" into the 'scrapers' folder, then reload the extension.`;
            return;
        }

        // Attach the click event to the parse button
        parseButton.addEventListener('click', async () => {
            resultBox.textContent = 'Parsing... (Open page console to see logs)';
            try {
                // 1. Inject the scraper file into the page
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: [scraperFile],
                });

                // 2. Execute the scraper's parse method
                const [{ result }] = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: async () => {

                        try {
                            if (typeof Soraya?.default !== 'function') {
                                throw new Error('Scraper class `Soraya.default` not found.');
                            }
                            const scraper = new Soraya.default();
                            if (typeof scraper.parse !== 'function') {
                                throw new Error('`parse` method not found on scraper instance.');
                            }

                            const parseResult = await scraper.parse('en');
                            return { success: true, data: parseResult };

                        } catch (err) {
                            console.error("Error inside scraper's parse() method:", err);
                            return {
                                success: false,
                                error: err.message,
                                stack: err.stack,
                                name: err.name
                            };
                        }
                    },
                });

                // Check if the result contains an error
                if (result.success) {
                    // Display the successful result
                    resultBox.textContent = JSON.stringify(result.data, null, 2);
                } else {
                    // Display the error details
                    resultBox.textContent = `❌ Error inside scraper's method: ${result.error}`;
                    resultBox.style.color = 'red';
                    resultBox.style.fontFamily = 'monospace';
                }

            } catch (e) {
                resultBox.textContent = `Error: ${e.message}`;
            }
        });

    } catch (error) {
        statusEl.textContent = `Error: ${error.message}`;
        console.error('Extension error:', error);
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    if (!header) return;

    // Tell the parent window (content.js) to take over dragging
    header.addEventListener('mousedown', (e) => {
        e.preventDefault();
        window.parent.postMessage({
            type: 'drag-start',
            event: { clientX: e.clientX, clientY: e.clientY }
        }, '*');
    });

    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const resultBox = document.getElementById('resultBox');

    function copyToClipboard() {
        if (!resultBox) return;
        const text = resultBox.textContent || resultBox.innerText || '';
        navigator.clipboard?.writeText(text).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        });
    }

    function clearResults() {
        if (!resultBox) return;
        resultBox.textContent = '';
    }

    if (copyBtn) copyBtn.addEventListener('click', copyToClipboard);
    if (clearBtn) clearBtn.addEventListener('click', clearResults);
});
