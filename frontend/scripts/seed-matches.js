#!/usr/bin/env node
// scripts/seed-matches.js
// Importar los 104 partidos desde CSV a Supabase
// Ejecutar: node scripts/seed-matches.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Mapeo de códigos de equipos a emojis de banderas
const FLAGS = {
  MEX: '🇲🇽', USA: '🇺🇸', CAN: '🇨🇦', ECU: '🇪🇨',
  BRA: '🇧🇷', ARG: '🇦🇷', COL: '🇨🇴', CHI: '🇨🇱',
  URU: '🇺🇾', PER: '🇵🇪', VEN: '🇻🇪', PAR: '🇵🇾',
  FRA: '🇫🇷', DEU: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ESP: '🇪🇸',
  ITA: '🇮🇹', POR: '🇵🇹', NLD: '🇳🇱', BEL: '🇧🇪',
  CHE: '🇨🇭', AUT: '🇦🇹', DNK: '🇩🇰', SWE: '🇸🇪',
  NOR: '🇳🇴', POL: '🇵🇱', CZE: '🇨🇿', HRV: '🇭🇷',
  SEN: '🇸🇳', MAR: '🇲🇦', NGA: '🇳🇬', CMR: '🇨🇲',
  GHA: '🇬🇭', EGY: '🇪🇬', TUN: '🇹🇳', CIV: '🇨🇮',
  JPN: '🇯🇵', KOR: '🇰🇷', IRN: '🇮🇷', AUS: '🇦🇺',
  SAU: '🇸🇦', QAT: '🇶🇦', IRQ: '🇮🇶'
};

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, i) => {
      obj[header.trim()] = values[i]?.trim() || '';
      return obj;
    }, {});
  });
}

async function seedMatches() {
  console.log('🏆 Iniciando importación de partidos...\n');

  const csvPath = path.join(__dirname, '../backend/data/matches_104.csv');
  const rows = parseCSV(csvPath);

  // Convertir filas CSV a formato de BD
  const matches = rows.map(row => ({
    phase: row.phase,
    group_name: row.group_name || null,
    match_number: parseInt(row.match_number),
    team_a: row.team_a,
    team_b: row.team_b,
    team_a_code: row.team_a_code !== 'TBD' ? row.team_a_code : null,
    team_b_code: row.team_b_code !== 'TBD' ? row.team_b_code : null,
    team_a_flag: FLAGS[row.team_a_code] || '🏳️',
    team_b_flag: FLAGS[row.team_b_code] || '🏳️',
    scheduled_at: row.scheduled_at_utc,
    stadium: row.stadium,
    city: row.city,
    status: 'pending'
  }));

  // Insertar en lotes de 20
  const BATCH_SIZE = 20;
  let inserted = 0;

  for (let i = 0; i < matches.length; i += BATCH_SIZE) {
    const batch = matches.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('matches').insert(batch);

    if (error) {
      console.error(`❌ Error en lote ${i}-${i + BATCH_SIZE}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Insertados partidos ${i + 1}–${Math.min(i + BATCH_SIZE, matches.length)}`);
    }
  }

  console.log(`\n🎉 Listo! ${inserted} partidos importados de ${matches.length}`);

  // Verificar
  const { count } = await supabase
    .from('matches')
    .select('id', { count: 'exact' });
  console.log(`📊 Total en BD: ${count} partidos`);
}

seedMatches().catch(console.error);
