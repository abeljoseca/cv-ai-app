import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test('debe permitir registro de nuevo usuario', async ({ page }) => {
    await page.goto('/register');

    // Llenar formulario
    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'TestPassword123');
    await page.fill('input[name="confirmPassword"]', 'TestPassword123');

    // Enviar
    await page.click('button:has-text("Registrarse")');

    // Esperar redirección a onboarding
    await expect(page).toHaveURL('/onboarding');
  });

  test('debe mostrar error con contraseñas diferentes', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Different123');

    await page.click('button:has-text("Registrarse")');

    // Debe mostrar error
    await expect(page.locator('text=no coinciden')).toBeVisible();
  });

  test('debe permitir login después del registro', async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'TestPassword123';

    // Registrar
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button:has-text("Registrarse")');

    // Completar onboarding mínimo
    await page.fill('input[placeholder="Juan"]', 'Test');
    await page.fill('input[placeholder="Pérez"]', 'User');
    await page.fill('input[placeholder="juan@email.com"]', email);
    await page.fill('input[placeholder="Ej: Ingeniero de Software"]', 'Tester');

    await page.click('button:has-text("Continuar")');

    // Debe redirigir a perfil
    await expect(page).toHaveURL('/perfil');
  });
});
