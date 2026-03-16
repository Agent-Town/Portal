# Global Audience And Voice Requirements

Status: Build-agent ready

This document defines the audience constraints that future frontend design work must satisfy.

It exists because the product is not for AI-native insiders only.

## 1. Audience Definition

The current primary audiences are:

- international users with basic digital literacy
- Chinese users
- users who may not understand:
  - AI agents
  - LLMs
  - model providers
  - API concepts
  - machine-learning terminology

The product should feel like:

- a game-like world
- a guided assistant experience
- a serious tool with playful framing

It should not feel like:

- a research dashboard
- a model-provider console
- an internal developer tool

## 2. Core Audience Rules

### 2.1 Task-first language

The first viewport of critical screens should prioritize:

- what this place is
- what the user can do next
- why it matters now

The first viewport should avoid unexplained terms like:

- LLM
- model provider
- context window
- inference
- OAuth
- agent runtime

These may appear in advanced settings, debug areas, or clearly secondary surfaces.

### 2.2 Conversation-first depth

The product should assume the user can ask the built-in assistant to explain detail.

Design implication:

- the default interface should stay dead simple
- deep operational detail should be available, but not forced into the main surface
- when choosing between another dense UI block and assistant-guided explanation, prefer the assistant path unless the task requires immediate manual control

### 2.3 Game-like, not childish

The interface may use:

- district names
- worlded language
- helper metaphors
- quest-like framing

But it must still:

- respect user time
- remain readable
- keep operational truth clear

### 2.4 Timeless over trendy

Do not optimize for fleeting UI trends.

Optimize for:

- clarity
- comfort
- calm
- longevity
- adaptability across locales and providers

## 3. Internationalization Requirements

### 3.1 Layout resilience

Critical screens must tolerate:

- at least `35%` text expansion
- Chinese/CJK copy
- line wrapping in buttons, labels, and section headers where needed

### 3.2 Typography resilience

The system must support:

- Latin scripts
- Chinese/CJK fallback rendering

Essential UI must not depend on:

- uppercase styling
- decorative Latin-only fonts
- fixed-width English assumptions

### 3.3 Imagery rule

No essential instruction may be embedded in imagery or background art.

All critical meaning must be available as text.

## 4. Provider And Model Flexibility

The platform will support different:

- AI models
- service providers
- local and regional services

Design implication:

- provider/model-specific settings must not dominate the main user flow
- task-level framing comes first
- advanced provider/model controls stay secondary unless the task explicitly requires them

## 5. Chinese Audience Requirements

The initial spec must explicitly support Chinese users.

Design implications:

- CJK-safe font fallback is mandatory
- button labels and section titles must tolerate wider glyphs and different visual density
- do not rely on uppercase, condensed Western display treatment, or extreme letter spacing for meaning

## 6. Voice-Ready Requirements

Voice control is not the current implementation target, but the design must remain compatible with it.

### 6.1 Speakable controls

Primary and common actions should use short labels that are easy to say aloud, for example:

- Enter
- Open Office
- Open House
- Send
- Connect Brain
- Open Trainer

Avoid making primary controls depend on:

- symbols without text meaning
- abbreviations that are hard to say
- long technical labels

### 6.2 Speakable state feedback

Status messages should be:

- short
- understandable when read aloud
- not overloaded with internal technical details

### 6.3 No hover dependency

Critical information and controls must not depend on hover-only disclosure because:

- touch users cannot hover
- voice-first users may never hover

## 7. Measurable Acceptance Targets

Future design work should be considered compliant only if:

- critical screens remain understandable without AI jargon in the first viewport
- key redesigned screens tolerate Chinese/CJK text without clipping
- layouts survive `35%` text expansion
- no essential meaning is embedded in images
- major controls use concise, speakable labels

## 8. Screens Covered By This Requirement

The highest-priority screens for these checks are:

- start
- town hub / district modal
- house console
- house office
- agent dock
- leaderboard empty state
- registry search and cards

## 9. Implementation Rule

If a proposed visual solution works only for English, only for Latin display fonts, or only for users already fluent in AI/provider vocabulary, it is not acceptable.
