DELETE FROM questions
WHERE topic LIKE '%?%'
   OR content LIKE '%?%';

UPDATE questions
SET
  content = '在高并发系统中，你会如何处理缓存层与关系型数据库之间的一致性问题？',
  "expectedKeywords" = '缓存失效,延迟双删,重试,数据库一致性,热点数据',
  follow_up_hints = '故障处理,重试时机,热点数据保护',
  evaluation_focus = '缓存设计,数据库设计,系统设计',
  rubric = '需要给出具体的一致性方案，说明失败路径，并讨论在高流量下的缓解手段。',
  updated_at = now()
WHERE topic = '缓存一致性';

UPDATE questions
SET
  content = '请你说明浏览器如何把页面结构、样式规则和脚本逻辑转换成最终屏幕上的像素，以及性能问题通常出现在什么阶段。',
  "expectedKeywords" = '文档树,样式树,渲染树,布局,绘制',
  follow_up_hints = '重排原因,脚本执行影响,性能分析',
  evaluation_focus = '浏览器渲染,性能优化',
  rubric = '重点考察是否能清晰解释渲染流水线，以及是否了解常见性能瓶颈。',
  updated_at = now()
WHERE topic = '渲染流水线';

INSERT INTO questions (
  position_id,
  topic,
  type,
  difficulty,
  content,
  "expectedKeywords",
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  '缓存一致性',
  'technical',
  'intermediate',
  '在高并发系统中，你会如何处理缓存层与关系型数据库之间的一致性问题？',
  '缓存失效,延迟双删,重试,数据库一致性,热点数据',
  '故障处理,重试时机,热点数据保护',
  '缓存设计,数据库设计,系统设计',
  '需要给出具体的一致性方案，说明失败路径，并讨论在高流量下的缓解手段。',
  true
FROM positions p
WHERE p.slug = 'java-backend-engineer'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.position_id = p.id AND q.topic = '缓存一致性'
  );

INSERT INTO questions (
  position_id,
  topic,
  type,
  difficulty,
  content,
  "expectedKeywords",
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  '渲染流水线',
  'technical',
  'intermediate',
  '请你说明浏览器如何把页面结构、样式规则和脚本逻辑转换成最终屏幕上的像素，以及性能问题通常出现在什么阶段。',
  '文档树,样式树,渲染树,布局,绘制',
  '重排原因,脚本执行影响,性能分析',
  '浏览器渲染,性能优化',
  '重点考察是否能清晰解释渲染流水线，以及是否了解常见性能瓶颈。',
  true
FROM positions p
WHERE p.slug = 'web-frontend-engineer'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.position_id = p.id AND q.topic = '渲染流水线'
  );

INSERT INTO questions (
  position_id,
  topic,
  type,
  difficulty,
  content,
  "expectedKeywords",
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  '分布式锁与幂等保障',
  'technical',
  'intermediate',
  '如果你要为秒杀下单或重复回调场景设计并发控制，你会如何同时保证分布式锁的可靠性和接口幂等性？',
  '幂等,唯一标识,锁超时,重试,补偿',
  '锁失效后的处理,幂等键设计,异常补偿',
  '并发控制,系统设计',
  '重点看是否能区分锁与幂等的职责边界，并解释异常场景下的数据正确性保障。',
  true
FROM positions p
WHERE p.slug = 'java-backend-engineer'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.position_id = p.id AND q.topic = '分布式锁与幂等保障'
  );

INSERT INTO questions (
  position_id,
  topic,
  type,
  difficulty,
  content,
  "expectedKeywords",
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  '长列表渲染优化',
  'technical',
  'intermediate',
  '当页面需要一次展示大量列表数据时，你会从渲染、交互和数据加载三个层面如何做优化？',
  '虚拟列表,分页加载,骨架屏,重绘控制,交互流畅',
  '首屏策略,滚动性能,数据分片',
  '性能优化,工程质量',
  '重点看是否具备分层优化思路，能同时兼顾首屏体验、滚动性能和代码可维护性。',
  true
FROM positions p
WHERE p.slug = 'web-frontend-engineer'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.position_id = p.id AND q.topic = '长列表渲染优化'
  );

INSERT INTO questions (
  position_id,
  topic,
  type,
  difficulty,
  content,
  "expectedKeywords",
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  '线上异常监控与排障',
  'scenario',
  'intermediate',
  '如果线上前端页面突然出现大量异常上报，但你暂时无法稳定复现，你会如何定位问题并控制影响范围？',
  '异常监控,埋点信息,版本对比,降级方案,回滚',
  '如何快速定位用户范围,如何补充诊断信息,如何防止再次发生',
  '线上排障,工程质量',
  '重点看是否具备线上问题排查路径、影响面控制意识，以及对监控埋点质量的理解。',
  true
FROM positions p
WHERE p.slug = 'web-frontend-engineer'
  AND NOT EXISTS (
    SELECT 1 FROM questions q
    WHERE q.position_id = p.id AND q.topic = '线上异常监控与排障'
  );

DELETE FROM questions
WHERE topic ~ '[A-Za-z]{3,}'
   OR content ~ '[A-Za-z]{3,}';
