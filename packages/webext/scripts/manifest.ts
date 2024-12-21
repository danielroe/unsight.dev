import fs from 'node:fs/promises'
import { getManifest } from '../src/manifest'
import { log, r } from './utils'

export async function writeManifest() {
  await fs.writeFile(r('extension/manifest.json'), JSON.stringify(await getManifest(), null, 2))
  log('PRE', 'write manifest.json')
}

writeManifest()
