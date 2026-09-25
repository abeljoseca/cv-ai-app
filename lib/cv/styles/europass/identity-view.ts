// Identity values in a Europass CV (spec change 26): contenido_json keeps only the on/off
// switches (valor always null); the server injects the decrypted values when rendering
// the CV for its owner, and strips them before anything is stored.

import type { IdentityData } from '@/lib/identity'
import { formatBirthDate } from './format'
import type { EuropassContent } from './schema'

export function withIdentity(content: EuropassContent, identity: IdentityData): EuropassContent {
  const ip = content.informacion_personal
  return {
    ...content,
    informacion_personal: {
      ...ip,
      fecha_nacimiento: { ...ip.fecha_nacimiento, valor: formatBirthDate(identity.fecha_nacimiento) },
      nacionalidad: { ...ip.nacionalidad, valor: identity.nacionalidad ?? null },
      direccion: { ...ip.direccion, valor: identity.direccion ?? null },
    },
  }
}

export function withoutIdentity(content: EuropassContent): EuropassContent {
  const ip = content.informacion_personal
  return {
    ...content,
    informacion_personal: {
      ...ip,
      fecha_nacimiento: { activo: ip.fecha_nacimiento.activo, valor: null },
      nacionalidad: { activo: ip.nacionalidad.activo, valor: null },
      direccion: { activo: ip.direccion.activo, valor: null },
    },
  }
}
