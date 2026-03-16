# Audience, Globalization, and Voice Readiness

This file defines who the product is for and what future design work must support.

These are hard requirements, not optional refinements.

## 1. Primary Audience

The product must work for people with very basic understanding of:

- AI
- machine learning
- LLMs
- model providers
- agent runtimes
- configuration systems

They should still be able to:

- understand where they are
- understand what the app is asking them to do
- feel that the product is helping them, not testing them
- make progress through guided actions without studying platform jargon
- ask the assistant about richer detail instead of manually unpacking dense screens

## 2. Product Character

The product should become more game-like, but not in a manipulative way.

That means:

- place-based navigation
- clear goals
- inviting rituals
- guided progression
- memorable environments
- rewarding clarity and momentum

It must not become:

- gamified for farming
- reward-loop driven
- cluttered with badges, streaks, or engagement hacks

The correct interpretation is:

- game-like in worldbuilding and guidance
- timeless in structure
- practical in function

## 3. Cultural And Language Scope

The product must be built for users from different countries and backgrounds.

Initial priority groups:

- international users using Latin-script languages
- Chinese users using Simplified Chinese

This means future design work must assume the product is multilingual by design, even if the first implementation remains English-first.

## 4. Language Design Rules

### 4.1 Plain language first

- primary actions must be short and direct
- top-layer copy must avoid internal platform jargon
- technical terms may appear only after the user already understands what the surface is for

### 4.2 Translation-safe structure

- no critical meaning should live only in decorative imagery
- no text baked into hero images or scene art for core flows
- no layout that depends on English-only short strings
- no reliance on all-caps English styling for meaning

### 4.3 CJK-safe typography and layout

Future design decisions must support:

- Simplified Chinese rendering without broken fallback glyphs
- line-length and line-height rules that remain readable with CJK text
- controls that still work when labels switch between Latin and Chinese text
- no fragile letter-spacing assumptions that only work in English

### 4.4 Flexible copy layers

Every screen should have:

- a primary label layer
- a supporting explanation layer

So a translated product can adapt meaning without overloading a single line.

## 5. LLM-Mediated Understanding

The assistant is part of the product experience, not an optional extra.

Design implication:

- users should be able to learn about data by talking with the assistant instead of navigating cluttered detail-heavy screens
- the default visual layer should stay simple enough for basic users to act confidently
- richer operational, trust, or diagnostic detail may still exist, but it should live in advanced, secondary, or assistant-readable layers
- detailed information should be grouped with stable labels and headings so the assistant can explain it accurately

## 6. Provider And Service Neutrality

The design must stay flexible across:

- local AI models
- cloud AI models
- different model providers
- different voice providers
- different service providers by region

Design implication:

- top-level user copy should talk about outcomes and tasks, not vendor names
- provider-specific language belongs in advanced, assistant-facing, or debug layers, not the primary product shell

## 7. Voice Readiness

Voice control is future scope, but the design must be ready for it now.

That means current interfaces should favor:

- clear action naming
- one dominant action per state
- explicit labels instead of ambiguous icon-only controls
- stable focus order
- readable input and confirmation states
- room for future listen/speak states without redesigning the whole shell

The design must not assume:

- typing is the only input mode
- reading dense text is acceptable on every step
- users can easily distinguish complex parameter names by voice

## 8. Timelessness Rules

The product should feel distinct without being trapped in a short-lived trend.

Future work should prefer:

- durable spacing systems
- restrained color use
- simple iconography
- strong hierarchy
- place-based identity

Future work should avoid:

- trend-heavy glass, neon, or novelty motifs that reduce usability
- decorative motion that ages quickly
- culture-specific metaphors that do not travel well

## 9. End-User Experience Rules

For standard users:

- the app should explain itself through layout before copy
- every screen should answer “what do I do now?”
- the user should not need to know what an LLM, runtime, or provider is
- the user should not be forced to manually inspect dense operational detail to make basic progress

For advanced users:

- deeper detail can exist
- but it must not define the first impression
- and it should remain structured enough for the assistant to interpret accurately

## 10. International Design Verification

Future design phases must include checks for:

- longer translated strings
- Simplified Chinese labels and headings
- mixed Latin and Chinese content on the same screen
- button and pill overflow behavior
- layout stability when copy length changes

## 11. Future Voice Verification

Future design phases should preserve room for:

- voice start control
- listening state
- speaking state
- confirmation state
- interruption or cancel state

Without requiring:

- a major shell redesign
- a separate voice-only layout

## 12. Current High-Risk Areas

These current product patterns are risky for international/basic-user support:

- expressive display typography used too broadly
- equal-weight button fields
- technical nouns too early in House Office
- some surfaces with heavy uppercase styling
- empty states that rely on product familiarity instead of explanation
- operational detail that still appears too early in House and Office surfaces

Future design work must reduce these risks, not normalize them.
