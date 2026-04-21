# Testing en Resumint

Este proyecto incluye tres niveles de testing:

## 1. Unit Tests (Vitest)

Tests de funciones aisladas y lógica de negocio.

```bash
npm run test                 # Ejecutar tests
npm run test:ui            # Ver en interfaz visual
```

**Ubicación:** `tests/lib/` y `tests/components/`

**Ejemplos:**
- `tests/lib/completitud.test.ts` - Tests de cálculo de completitud
- `tests/components/Chat.test.tsx` - Tests del componente Chat

## 2. Component Tests (Vitest + React Testing Library)

Tests de componentes React en aislamiento.

```bash
npm run test
```

**Ubicación:** `tests/components/`

**Casos cubiertos:**
- Renderizado de componentes
- Interacciones del usuario
- Cambios de estado
- Callbacks

## 3. E2E Tests (Playwright)

Tests que simulan flujos completos del usuario en el navegador.

```bash
npm run test:e2e            # Ejecutar en modo headless
npm run test:e2e:ui        # Ver en interfaz visual
```

**Ubicación:** `tests/e2e/`

**Flujos cubiertos:**
- Autenticación (registro y login)
- Creación de CV
- Flujos principales del usuario

## Configuración

### Vitest (`vitest.config.ts`)
- Entorno: jsdom
- Plugins: React
- Global setup

### Playwright (`playwright.config.ts`)
- Navegadores: Chromium, Firefox
- Base URL: http://localhost:3000
- WebServer automático

## Escribir Nuevos Tests

### Unit Test
```typescript
import { describe, it, expect } from 'vitest';

describe('Mi Función', () => {
  it('debe hacer algo', () => {
    expect(resultado).toBe(esperado);
  });
});
```

### Component Test
```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('debe renderizar', () => {
    render(<MyComponent />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

### E2E Test
```typescript
import { test, expect } from '@playwright/test';

test('flujo completo', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input', 'valor');
  await page.click('button');
  await expect(page).toHaveURL('/perfil');
});
```

## CI/CD Integration

Para GitHub Actions:
```yaml
- run: npm run test
- run: npm run test:e2e
```

## Cobertura

Objetivo: >80% de cobertura en funciones críticas.

Para ver cobertura con Vitest:
```bash
npm run test -- --coverage
```

## Tips

- Tests E2E necesitan servidor ejecutándose
- Usar `test.only` para debuggear un test específico
- Usar `test.skip` para saltar tests temporalmente
- Manter tests rápidos (<100ms idealmente)
