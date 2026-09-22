import '@testing-library/jest-dom';

// jsdom doesn't implement scrollIntoView — stub it so components that call it
// (e.g. auto-scrolling a chat to the latest message) don't crash under test.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}
