import { expect, test } from '@playwright/test'

// The main promise of the app, end to end in a real browser:
// sign up → create a habit → check it off today → it is still there later.
test('register, create a habit and check it off today', async ({ page }) => {
  const email = `e2e-${Date.now()}@test.local`

  await test.step('register a new account', async () => {
    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('a long enough password')
    await page.getByRole('button', { name: 'Create account' }).click()

    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
    await expect(page.getByText('No habits to track yet.')).toBeVisible()
  })

  await test.step('create a habit', async () => {
    await page.getByRole('link', { name: 'Create your first habit' }).click()
    await page.getByLabel('Name').fill('Drink water')
    await page.getByRole('button', { name: 'Create habit' }).click()

    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Drink water' }),
    ).toBeVisible()
  })

  await test.step('check it off on Today', async () => {
    await page.getByRole('link', { name: 'Today', exact: true }).click()
    const habit = page.getByRole('checkbox', { name: /Drink water/ })
    await expect(habit).not.toBeChecked()

    // click + toBeChecked, not check(): the optimistic update lands a tick
    // later (onMutate first awaits cancelQueries), and check() asserts the
    // new state right after the click, while toBeChecked() retries.
    await habit.click()

    await expect(habit).toBeChecked()
    await expect(page.getByText(/1 of 1 done/)).toBeVisible()
  })

  await test.step('the check is saved on the server', async () => {
    await page.reload()

    await expect(
      page.getByRole('checkbox', { name: /Drink water/ }),
    ).toBeChecked()
    await expect(page.getByText('Current streak: 1 day')).toBeAttached()
  })

  await test.step('after logout the page asks to log in again', async () => {
    await page.getByRole('button', { name: 'Log out' }).click()
    // Wait for the logout itself: Today is private, so once the session is
    // gone the app moves to /login. Navigating earlier would race the request.
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/habits')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Log in' })).toBeVisible()
  })
})
