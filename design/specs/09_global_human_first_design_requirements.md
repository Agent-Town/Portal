# Global Human-First Design Requirements

Status: required cross-cutting design contract
Last updated: 2026-03-16

This document defines the audience and interaction rules that every future design phase must satisfy.

It exists because visual refinement alone is not enough.
The product must work for people with:

1. very basic understanding of AI,
2. very basic understanding of machine learning,
3. very basic understanding of LLMs,
4. very basic understanding of AI agents,
5. different languages,
6. different countries,
7. different model and provider setups.

The design must therefore be:

1. human-first,
2. globally understandable,
3. game-like without becoming childish,
4. provider-agnostic,
5. voice-ready for future phases.

## 1. Primary audience contract

The current design target is not "AI power users."

The first target users are:

1. international general users,
2. Chinese users,
3. users with low technical literacy,
4. users who understand goals better than systems,
5. users who may not know what a model, agent, context window, provider, or embedding is.

Design implication:

1. do not assume AI vocabulary,
2. do not assume English fluency,
3. do not assume familiarity with Western software metaphors alone,
4. do not assume the user understands why the app has multiple services, models, wallets, or memory layers.

## 2. Product feeling requirement

The app should feel like:

1. a world,
2. a place,
3. a guided game,
4. a calm tool,
5. a trustworthy companion.

It should not feel like:

1. a developer console,
2. an AI research dashboard,
3. a prompt engineering product,
4. a settings labyrinth,
5. a Western-only metaphor puzzle.

Game-like means:

1. place-based navigation,
2. memorable rooms and objects,
3. simple verbs,
4. visible progress,
5. playful clarity.

Game-like does not mean:

1. noise,
2. points,
3. token farming,
4. childish cartoon excess,
5. hidden critical actions behind cleverness.

## 3. Language and literacy rules

Every future design phase must obey these rules:

1. Prefer plain-language labels over technical terms.
2. Prefer verbs users already know:
   - `Open`
   - `Save`
   - `Bring`
   - `Hide`
   - `Share`
   - `Check`
3. Avoid AI jargon in primary UI.
4. If technical language is necessary, keep it secondary or behind disclosure.
5. Do not rely on long explanatory text as the main way to teach the UI.
6. Use icons and structure to carry meaning before text length does.
7. Any critical action must remain understandable when translated.

Primary UI should avoid leading with terms like:

1. LLM
2. agent memory
3. provenance receipt
4. embedding
5. context injection
6. vector
7. model routing
8. provider failover

These may exist in advanced or debug surfaces.
They must not dominate primary user flows.

## 4. Internationalization rules

The design must work for multiple languages from the start.

Initial design target:

1. English or international default
2. Chinese

Future-friendly requirement:

1. do not make layout decisions that only work for English,
2. do not assume Latin word length,
3. do not assume Chinese text will wrap like English,
4. do not bake important text into images,
5. do not rely on flag icons as language selectors,
6. do not encode meaning only through culture-specific idioms or slang.

Layout requirements:

1. controls must survive shorter Chinese labels and longer non-English labels,
2. cards and chips must allow content growth without breaking hierarchy,
3. line-height must remain comfortable for Latin and Chinese scripts,
4. icon-first controls still need accessible localized names,
5. truncation must never hide the only meaningful part of a choice.

Copy requirements:

1. use short direct phrases,
2. avoid idioms,
3. avoid humor that depends on English wordplay,
4. avoid metaphors that only make sense in one culture,
5. keep room for translated expansion.

## 5. Chinese-target design rules

Because Chinese is an explicit near-term target, future design agents must account for:

1. denser character-based reading,
2. shorter visible labels that may invite over-compression,
3. the need for clean spacing around dense character groups,
4. typography that stays readable without relying on decorative Latin display patterns,
5. layouts that remain elegant when labels become visually compact.

Design implication:

1. do not shrink Chinese UI text because it "fits more,"
2. do not make Latin headings so stylized that Chinese fallback feels like a second-class experience,
3. ensure icon, spacing, and structure do enough work that language changes do not collapse clarity.

## 6. Model, provider, and service flexibility rules

The product must remain flexible across:

1. different AI models,
2. different providers,
3. different service integrations,
4. future region-specific stacks.

Design implication:

1. do not hardcode one provider's brand language into core hierarchy,
2. do not build key actions around one model family name,
3. do not make provider setup the center of the product story,
4. present providers as interchangeable backroom infrastructure unless the user is explicitly in an advanced configuration surface,
5. keep primary user flows outcome-based, not provider-based.

The user should think:

1. "talk to my agent"
2. "save this"
3. "open this"
4. "check this"

not:

1. "which inference stack is active right now?"

## 7. Voice-ready design rules

Voice is not the current primary interaction.
The design must still prepare for it.

Future voice-ready UI requires:

1. clear screen structure,
2. stable primary actions,
3. obvious current context,
4. short unambiguous labels,
5. visible confirmation states,
6. accessible names that can be mapped to spoken commands,
7. controls large enough for touch-first fallback.

Future design agents must therefore avoid:

1. ambiguous icon-only controls without accessible text,
2. two different primary actions with nearly identical wording,
3. hidden state changes that only color communicates,
4. crowded button clusters that cannot be referred to clearly in speech,
5. layouts where the user cannot tell what room or object is active.

Voice-ready does not mean adding voice controls now.
It means building a visual grammar that can later support them cleanly.

## 8. Universal interaction contract

Every major surface should answer these questions visually:

1. Where am I?
2. What can I do here?
3. What should I do next?
4. What is safe to tap?
5. What already happened?

If the user must infer these from dense labels or technical copy, the design is not ready.

## 9. Required cross-cutting acceptance criteria

Every approved design phase must now also prove:

1. the primary action can be understood without AI jargon,
2. the key screen remains understandable with short translated labels,
3. no essential meaning depends on long English copy,
4. icon-first controls preserve accessible names,
5. the UI still feels game-like and friendly rather than enterprise-technical,
6. future voice control would have a stable target vocabulary,
7. the design does not privilege one provider or model brand in primary flows.

## 10. Required design review questions

Future design agents must ask of every changed surface:

1. Would a non-technical user understand this without knowing AI terms?
2. Would this still make sense in Chinese?
3. Is the current room or task obvious without reading a paragraph?
4. Are the actions named in human verbs rather than system nouns?
5. Could this screen later support voice commands without renaming everything?
6. Is the playful world helping comprehension or distracting from it?

## 11. Phase implications

These requirements apply to every design phase, with special emphasis on:

1. D1 for typography, icon, spacing, and token rules,
2. D2 for the first-use experience and town hub comprehension,
3. D4 for House Library human task framing,
4. D5 for guided onboarding and sidebar restraint,
5. D6 for accessibility, empty states, motion, and final cross-device clarity.

## 12. Definition of success

This design direction succeeds only when the product feels like:

1. a game-like place people can navigate,
2. a trustworthy tool people can use without AI expertise,
3. a globally adaptable interface,
4. a system that can later add voice without redesigning its core grammar.
