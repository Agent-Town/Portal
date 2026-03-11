const { test, expect } = require('@playwright/test');
const ExperienceProfiles = require('../public/experience_profiles.js');
const LlmCatalog = require('../public/llm_catalog.js');

test('mainland locale suggestion only triggers for mainland-specific Chinese locales', () => {
  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-CN'])).toBe('cn-mainland');
  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-Hans'])).toBe('cn-mainland');
  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-Hans-CN'])).toBe('cn-mainland');

  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-TW'])).toBe('global-default');
  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-Hant'])).toBe('global-default');
  expect(ExperienceProfiles.browserSuggestedPresetId(['zh-Hans-SG'])).toBe('global-default');
  expect(ExperienceProfiles.browserSuggestedPresetId(['en-US', 'zh-HK'])).toBe('global-default');
});

test('mainland default provider uses concrete qwen model ids', () => {
  expect(LlmCatalog.getDefaultProvider('cn-mainland')).toBe('qwen');
  expect(LlmCatalog.getSupportedModels('qwen')).toEqual([
    'qwen3-coder-plus',
    'qwen3-max',
    'qwen3-vl-plus'
  ]);
  expect(LlmCatalog.getDefaultModel('qwen')).toBe('qwen3-coder-plus');
  expect(LlmCatalog.hasTemplateModels('qwen')).toBe(false);
  expect(LlmCatalog.hasTemplateModels('qianfan')).toBe(true);
});
