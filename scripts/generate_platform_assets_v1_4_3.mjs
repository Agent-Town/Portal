import { buildInventoryRows, buildPlatformManifest, writeInventoryMarkdown, writePlatformManifest } from './platform_assets_v1_4_3_lib.mjs';

const manifest = buildPlatformManifest();
writePlatformManifest(manifest);
writeInventoryMarkdown(buildInventoryRows());

console.log(`Generated V1.4.3 platform manifest with ${manifest.assets.length} assets (${manifest.totalBytes} bytes).`);
