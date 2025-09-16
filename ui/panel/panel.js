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
        const keyWithWww = domain.replace(/[.\-]/g, '_');

        const domainParts = domain.split('.');
        const keyWithoutFirstSubString = domainParts.length > 2
            ? domainParts.slice(1).join('_')
            : null;


        console.log('Domain:', domain);
        console.log('Possible keys:', { keyWithWww, keyWithoutFirstSubString });

        let scraperKey = null;
        let scraperFile = null;
        async function findScraper() {
            // 1. Try with the full domain key (e.g., www_example_com)
            const fileWithWww = `scrapers/${keyWithWww}.js`;
            console.log('Trying scraper file with www:', fileWithWww);
            try {
                const response = await fetch(chrome.runtime.getURL(fileWithWww));
                if (response.ok) {
                    scraperKey = keyWithWww;
                    scraperFile = fileWithWww;
                    return true;
                }
            } catch { }

            // 2. If it starts with 'www' and wasn't found, try without it (e.g., example_com)
            if (keyWithoutFirstSubString) {
                const fileWithoutFirstSubString = `scrapers/${keyWithoutFirstSubString}.js`;
                console.log('Trying scraper file without first sub-string:', fileWithoutFirstSubString);
                try {
                    const response = await fetch(chrome.runtime.getURL(fileWithoutFirstSubString));
                    if (response.ok) {
                        scraperKey = keyWithoutFirstSubString;
                        scraperFile = fileWithoutFirstSubString;
                        return true;
                    }
                } catch { }
            }

            return false;
        }

        // Check if the scraper file is packaged with the extension
        if (await findScraper()) {
            statusEl.textContent = `✅ Scraper found: ${scraperKey}`;
            parseButton.disabled = false;
            console.log('Using scraper file:', scraperFile);
        } else {
            statusEl.textContent = `❌ Scraper not found for: ${domain}`;
            resultBox.textContent = `Tried to find scrapers matching:\n- ${keyWithWww}.js\n${keyWithoutFirstSubString ? `- ${keyWithoutFirstSubString}.js\n` : ''}\nBuild and copy the correct scraper into the 'scrapers' folder, then reload the extension.`;
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
                if (result?.success || null) {
                    // Display the successful result
                    resultBox.textContent = JSON.stringify(result.data, null, 2);
                } else {
                    // Display the error details
                    const hint = [
                        '1. Check the isProduct.js() method to ensure it correctly identifies product pages.',
                        '2. Ensure there\'s no null, undefined object values. Did you forget to check for them?',
                        '3. Are the DOM selectors correct?',
                        '4. Look at the console logs for more detailed error information.'
                    ];

                    const errorDetails = `❌ Error inside scraper's method: ${result?.error || 'Promise Rejected'}`;
                    const hintHTML = `<div style="color: #13505B; margin-top: 1em; font-weight: normal;">${hint.join('<br>')}</div>`;

                    resultBox.innerHTML = `<div>${errorDetails}</div>${result ? '' : hintHTML}`;
                    resultBox.style.color = '#DB5A42';
                    resultBox.style.fontFamily = 'monospace';
                    resultBox.style.fontWeight = 'bold';
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
