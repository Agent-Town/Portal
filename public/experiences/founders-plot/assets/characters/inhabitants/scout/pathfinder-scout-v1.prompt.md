# Pathfinder Scout v1 Prompt

Use case: stylized-concept
Asset type: production candidate 2D game character sprite sheet for Agent Town Founders Plot, exact 4 columns x 4 rows, 2048 x 2048 PNG source image for chroma-key alpha removal.

Primary request: Create a dedicated pathfinder scout character sprite sheet for Agent Town Founders Plot. Character: Mira Trailmark, an adult-coded frontier pathfinder / terrain scout who reads ridgelines, maps, and settlement sites. She is practical, calm, observant, and distinct from the messenger. Silhouette: compact adult explorer with travel cloak/short coat, brimmed field hat, survey scarf, map satchel, small brass compass, rolled map case, walking staff or survey rod kept close to body, and a tiny cyan locator charm. Warm frontier storybook game art with brass, leather, canvas, dust, teal-cyan agent-tech accents.

MOST IMPORTANT FRAMING RULE: Every pose, including staff, raised arm, compass, map case, and hat, must fit completely inside its own invisible 512 x 512 cell. Imagine a centered safe box inside each cell that is only 360 pixels tall and 320 pixels wide. Keep the whole character and props inside that safe box. Leave large empty #ff00ff padding around every pose: minimum 90 pixels from all cell edges and row/column boundaries. Do not let the staff or map case cross into a neighboring cell.

Canvas and sheet requirements: EXACTLY 2048 x 2048 square image. EXACTLY 4 columns x 4 rows of equal 512 x 512 animation cells. One full-body character pose per cell. No labels, no letters, no numbers, no grid lines, no cell borders, no watermark, no UI text, no signature. Perfectly flat solid #ff00ff chroma-key background across the entire sheet, with no shadows, gradients, texture, floor plane, reflections, or lighting variation. Do not use #ff00ff or close magenta/pink in the character, props, glow, or outlines.

Style/world reference: match the polished semi-3D painterly edge quality of Agent Town Founders Plot inhabitants and the warm frontier town assets: readable at small Three.js billboard scale, crisp antialiased cutout, consistent upper-left lighting, cozy frontier-tech rather than hard cyberpunk. Make her distinct from Clover, Rook messenger, Kettle worker, Oona hauler, and Rigger builder. Adult inhabitant, not childlike, not mascot, not chibi.

Avoid: messenger/courier identity, letter delivery, official notice plate, fantasy ranger, weapons, bow, rifle, combat, armor, mage/fairy/wizard, childlike proportions, oversized head, Clover clone, Rook clone, text/logos, busy unreadable details, hard cell grid, prop overlap, cropped limbs, cropped feet, cropped hats, cells touching each other.

Animation rows, exactly one small centered full-body pose in each cell:
Row 1 idle/observe, columns 1-4: alert pathfinder stance; checking horizon; one hand near compass; map satchel visible; staff lowered and close to body.
Row 2 walk/travel, columns 1-4: careful trail walk cycle; staff planted close; cloak and satchel subtly moving; feet fully visible and inside safe box.
Row 3 survey/work action, columns 1-4: reading a small map, using compass, sighting terrain with survey rod, marking a route; all props compact and no readable text.
Row 4 report-ready/return, columns 1-4: returning with a rolled Scout Report or map token, pointing toward route, small cyan locator glow, trustworthy successful scout energy; no official messenger plate.

Rendering: high-quality 2.5D painterly game sprite, clean crisp antialiased edges, consistent identity across all 16 frames, full-body three-quarter view suitable for Three.js billboard sprites.
