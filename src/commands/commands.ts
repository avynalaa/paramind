declare const Office: any;

Office.onReady(() => {
  // Register command handlers
});

// Function to show the taskpane
function showTaskpane() {
  Office.ribbon.requestUpdate({
    tabs: [{
      id: "TabHome",
      groups: [{
        id: "CommandsGroup",
        controls: [{
          id: "TaskpaneButton",
          enabled: true
        }]
      }]
    }]
  });
}

// Export functions for the manifest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    showTaskpane
  };
} 