require(`dotenv`).config()

const { Builder, By, Key, until } = require(`selenium-webdriver`)
const { Options } = require(`selenium-webdriver/firefox`)
const prompts = require(`prompts`)

const BITBUCKET_EMAIL = process.env.BITBUCKET_EMAIL
const BITBUCKET_PASSWORD = process.env.BITBUCKET_PASSWORD
const HEADLESS_MODE = !process.env.DISPLAY_BROWSER

const options = new Options()
if (HEADLESS_MODE) {
  options.headless()
}

;(async () => {
  const driver = await new Builder().forBrowser(`firefox`).setFirefoxOptions(options).build()

  console.info(`Logging in with Bitbucket account ${ BITBUCKET_EMAIL }`)

  try {
    await driver.get(`https://bitbucket.org/account/signin/`)
    await driver.wait(until.titleIs(`Log in to continue - Log in with Atlassian account`))

    const emailInput = By.id(`username`)
    const passwordInput = By.id(`password`)

    await driver.wait(until.elementLocated(emailInput), 30000)
    await driver.findElement(emailInput).sendKeys(BITBUCKET_EMAIL, Key.RETURN)
    await driver.wait(until.elementIsVisible(await driver.findElement(passwordInput)), 30000).sendKeys(BITBUCKET_PASSWORD, Key.RETURN)

    const twoFactorInput = By.id(`two-step-verification-otp-code-input`)
    const twoFactorEnabled = await driver.wait(until.elementLocated(twoFactorInput), 30000)

    if (twoFactorEnabled) {
      console.info(`Your Bitbucket account has 2FA enabled`)

      const response = await prompts({
        type: `text`,
        name: `twoFactorCode`,
        message: `Enter 6-digit verification code:`,
        validate: value => {
          if (!Number(value)) {
            return `Code can only contain numbers`
          }

          if (value.length !== 6) {
            return `Code must be 6 digits long`
          }

          return true
        }
      })

      await driver.findElement(twoFactorInput).sendKeys(response.twoFactorCode)
    }

    await driver.wait(until.titleMatches(/Overview.*Bitbucket/), 30000)
    await driver.get(`https://bitbucket.org/tasconline/file-processor/addon/pipelines/home`)

    console.info(`Getting pipeline data`)

    const pipelineIframe = By.css(`[id^="pipelines__home__"]`)

    await driver.wait(until.elementLocated(pipelineIframe), 30000)
    await driver.switchTo().frame(await driver.findElement(pipelineIframe))
    await driver.wait(until.elementLocated(By.css(`table[data-test="pipeline-list-table"]`)), 30000)
    const n = await driver.findElement(By.css(`table[data-test="pipeline-list-table"] td[headers="number"]`))
    console.log(n)
    console.log(n.getText())
  } catch (e) {
    console.error(e)
  } finally {
    await driver.quit()
  }
})()
