chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Check if the tab URL is valid
    if (!tab.url?.startsWith('http')) {
      console.log('Cannot run on this page');
      return;
    }

    // Inject a script to check viewport width
    const [{ result: isMobile }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.innerWidth <= 768
    });

    if (isMobile) {
      // Mobile mode: Set popup and let browser handle it
      console.log('Mobile mode detected - using traditional popup');
      await chrome.action.setPopup({ popup: 'ui/popup/popup.html' });
      
      // Force popup to open (this triggers after setting popup)
      // Note: The popup will open automatically on next click
      
    } else {
      // Desktop mode: Remove popup and use floating panel
      console.log('Desktop mode detected - using floating panel');
      await chrome.action.setPopup({ popup: '' }); // Remove popup
      
      // Send message to content script to toggle floating panel
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE_PANEL' });
      } catch (messageError) {
        console.error('Error sending message to content script:', messageError);
      }
    }
  } catch (error) {
    console.error('Error in background script:', error);
  }
});

// Also listen for tab updates to reset popup state when switching between mobile/desktop
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    try {
      // Check viewport and set appropriate popup state
      const [{ result: isMobile }] = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => window.innerWidth <= 768
      });

      if (isMobile) {
        await chrome.action.setPopup({ popup: 'ui/popup/popup.html' });
      } else {
        await chrome.action.setPopup({ popup: '' });
      }
    } catch (error) {
      // Ignore errors for tabs that can't be scripted
    }
  }
});
