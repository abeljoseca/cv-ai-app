#!/bin/bash

# Script para configurar y ejecutar tests

echo "📦 Instalando dependencias de testing..."
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest @vitejs/plugin-react @playwright/test

echo "✅ Dependencias instaladas"

echo ""
echo "🧪 Ejecutando unit tests..."
npm run test -- --run

echo ""
echo "🎭 Ejecutando E2E tests..."
echo "⚠️  Asegúrate de que el servidor está ejecutándose (npm run dev)"
npm run test:e2e

echo ""
echo "✨ Tests completados"
