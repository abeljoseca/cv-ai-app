-- ============================================================
-- Migration: Update CV style IDs to new naming convention
-- Run BEFORE deploying the new codebase
-- Execute in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Step 1: Verify current state (run this first, save the output)
SELECT estilo, COUNT(*) as total
FROM cvs
GROUP BY estilo
ORDER BY total DESC;

-- ============================================================
-- Step 2: Execute migration
-- ============================================================

-- Map: classic → harvard
UPDATE cvs SET estilo = 'harvard' WHERE estilo = 'classic';

-- Map: modern → stanford
UPDATE cvs SET estilo = 'stanford' WHERE estilo = 'modern';

-- Map: minimal → minimalist (note: minimal was mislabeled as "Europeo" in the old UI
--   but was NOT a real Europass CV — it maps to minimalist, not europass)
UPDATE cvs SET estilo = 'minimalist' WHERE estilo = 'minimal';

-- Map: bold → silicon-valley
UPDATE cvs SET estilo = 'silicon-valley' WHERE estilo = 'bold';

-- Map: executive → executive (no change — same name, same concept)
-- UPDATE cvs SET estilo = 'executive' WHERE estilo = 'executive'; -- no-op

-- Map: mirror → mirror (no change)
-- UPDATE cvs SET estilo = 'mirror' WHERE estilo = 'mirror'; -- no-op

-- ============================================================
-- Step 3: Verify migration result (run after Step 2)
-- Expected: no rows with old style IDs (classic, modern, minimal, bold)
-- ============================================================

SELECT estilo, COUNT(*) as total
FROM cvs
GROUP BY estilo
ORDER BY total DESC;

-- ============================================================
-- Rollback (if needed — run to undo)
-- ============================================================
/*
UPDATE cvs SET estilo = 'classic'  WHERE estilo = 'harvard';
UPDATE cvs SET estilo = 'modern'   WHERE estilo = 'stanford';
UPDATE cvs SET estilo = 'minimal'  WHERE estilo = 'minimalist';
UPDATE cvs SET estilo = 'bold'     WHERE estilo = 'silicon-valley';
*/
