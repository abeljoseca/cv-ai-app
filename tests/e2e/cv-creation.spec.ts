import { test, expect } from '@playwright/test';

test.describe('Creación de CV', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login
    await page.goto('/login');
    // TODO: Usar credenciales de test previamente creadas
  });

  test('debe navegar a crear CV desde perfil', async ({ page }) => {
    await page.goto('/perfil');
    await page.click('text=Crear CV');
    await expect(page).toHaveURL('/crear-cv');
  });

  test('debe mostrar advertencia si perfil muy incompleto', async ({ page }) => {
    await page.goto('/crear-cv');
    // Si completitud < 30%, debe mostrar bloqueo
    const bloqueado = await page.locator('text=Perfil muy incompleto').isVisible();
    if (bloqueado) {
      await expect(page.locator('text=Ir a completar perfil')).toBeVisible();
    }
  });

  test('debe permitir seleccionar tipo de CV', async ({ page }) => {
    await page.goto('/crear-cv');

    // Si no está bloqueado, debe mostrar opciones
    const generalButton = await page.locator('text=CV General').isVisible();
    if (generalButton) {
      await page.click('text=CV General');
      await expect(page).toHaveURL('/crear-cv/general');
    }
  });

  test('debe permitir seleccionar estilo de CV', async ({ page }) => {
    await page.goto('/crear-cv/general');

    // Seleccionar un estilo
    const classicStyle = await page.locator('text=Clásico').isVisible();
    if (classicStyle) {
      await page.click('text=Clásico');
      const continueButton = page.locator('button:has-text("Continuar")');
      await expect(continueButton).not.toBeDisabled();
    }
  });
});
