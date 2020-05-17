const {Builder, By, Key, until} = require('selenium-webdriver')

;(async () => {
  const driver = await new Builder().forBrowser(`firefox`).build()

  try {
    await driver.get(`https://bitbucket.org`)
  } catch (e) {
    console.error(e)
  } finally {
    await driver.quit()
  }
})()
