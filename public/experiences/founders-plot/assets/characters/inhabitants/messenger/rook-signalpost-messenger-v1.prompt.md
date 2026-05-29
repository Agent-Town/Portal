# Rook Signalpost Messenger v1 Prompt

Use case: stylized-concept
Asset type: production candidate 2D game character sprite sheet for Agent Town Founders Plot, exact 4 columns x 4 rows, 2048 x 2048 PNG source image for chroma-key alpha removal.

Primary request: Create a new messenger character sprite sheet for Agent Town Founders Plot. Character: Rook Signalpost, an adult-coded frontier signal-courier / notice-runner in a wild-west frontier between old humanity and future human + AI agent collaboration. He is quick, funny, trustworthy, theatrical but practical. Tall narrow adult courier silhouette, lean long-legged proportions, compact torso, slightly angular head/hat shape, readable at small game scale. Cross-body leather dispatch satchel, small folded signal pennant on a short baton, and a glowing amber message plate / telegram slate with subtle AI interface light. Outfit: short dust-coat or capelet, rolled sleeves, brass buckles, boots, neckerchief, messenger straps, practical travel gear. Warm painterly frontier materials, brass, leather, dust, teal cloth accents.

MOST IMPORTANT FRAMING RULE: Every pose, including raised arms and raised props, must fit completely inside its own invisible 512 x 512 cell. Imagine a centered safe box inside each cell that is only 360 pixels tall and 320 pixels wide. Keep the entire character, hat, boots, hands, arms, message plate, pennant, and baton inside that safe box. Leave large empty #ff00ff padding around every pose: minimum 90 pixels from all cell edges and from invisible row/column boundaries. The characters should be noticeably smaller than typical sprite-sheet art. Do not let raised notices, pointing fingers, or pennants enter the row above or the neighboring column.

Canvas and sheet requirements: EXACTLY 2048 x 2048 square image. EXACTLY 4 columns x 4 rows of equal 512 x 512 animation cells. One full-body character pose per cell. No labels, no letters, no numbers, no grid lines, no cell borders, no watermark, no UI text, no signature. Perfectly flat solid #ff00ff chroma-key background across the entire sheet, with no shadows, gradients, texture, floor plane, reflections, or lighting variation. Do not use #ff00ff or close magenta/pink in the character, props, glow, or outlines.

Style references visible in context: Clover v1_4_4 no-hole sprites for polished semi-3D painterly edge quality and clean cutout readiness; Founders Plot desktop and Lumber Camp for warm wood/stone/brass/dust frontier material context. Use only as style/world reference. Do not copy Clover's rounded body/head, face, hair, vest layout, or pose language. Must be distinct from Clover, Kettle-37 worker, Oona Tallpack hauler, and builder. Adult inhabitant, not childlike, not mascot, not chibi.

Avoid: fantasy paper knight, armor, paper armor, mage, fairy, wizard robe, generic fantasy courier, childlike proportions, oversized head, Clover clone, text/logos on notices, busy unreadable details, hard cell grid, prop overlap, cropped limbs, cropped feet, cropped hats, cropped raised props, cells touching each other.

Animation rows, exactly one small centered full-body pose in each cell:
Row 1 idle/waiting, columns 1-4: alert stance with satchel/message plate; subtle variations checking trail, hand at satchel strap, pennant lowered, message plate ready.
Row 2 walk/trot, columns 1-4: quick courier movement cycle; long-legged trot, lean forward, satchel bounce, folded pennant kept close; feet fully visible and inside safe box.
Row 3 role action APPROVAL / REWARD / QUEST, columns 1-4: presenting glowing notice plate near chest height, pointing/signaling clearly with arms kept inside safe box, offering a small reward token, approval stamp gesture, quest direction flourish; no actual text.
Row 4 ready/attention flourish, columns 1-4: attention-getting courier flourish but compact: notice held high no higher than the hat, pennant raised only to shoulder/head height, pointing toward target, trustworthy theatrical energy without magic effects; all raised props fully inside the bottom-row cells.

Rendering: high-quality 2.5D painterly game sprite, clean crisp antialiased edges, consistent upper-left lighting, consistent character identity, full-body three-quarter view suitable for Three.js billboard sprites. Keep amber glow contained on the message plate, no background effects.
