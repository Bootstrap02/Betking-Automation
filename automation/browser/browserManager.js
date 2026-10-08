const { chromium } = require('playwright');
const { createAutomationConfig } = require('../config');

async function createPage(browser, { defaultTimeout, viewport }) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(defaultTimeout);
  return page;
}

async function launchBrowser(options = {}) {
  const config = createAutomationConfig();
  const {
    timeout = config.browserLaunchTimeoutMs,
    defaultTimeout = config.pageTimeoutMs,
    headless = config.browserHeadless,
    channel = config.browserChannel,
    viewport = { width: 1280, height: 800 },
  } = options;
  let browser;

  try {
    browser = await chromium.launch({
      headless,
      channel,
      timeout,
    });
    let page = await createPage(browser, { defaultTimeout, viewport });
    return {
      get browser() {
        return browser;
      },
      get page() {
        return page;
      },
      restorePage: async () => {
        if (!browser.isConnected()) {
          browser = await chromium.launch({
            headless,
            channel,
            timeout,
          });
        }
        page = await createPage(browser, { defaultTimeout, viewport });
        return page;
      },
      close: async () => {
        if (browser.isConnected()) {
          await browser.close();
        }
      },
    };
  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        throw new AggregateError(
          [error, closeError],
          `Browser setup failed and cleanup also failed: ${error.message}`,
        );
      }
    }
    throw new Error(`Browser launch or page setup failed: ${error.message}`, {
      cause: error,
    });
  }
}

module.exports = { createPage, launchBrowser };
