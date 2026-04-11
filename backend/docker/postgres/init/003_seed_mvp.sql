INSERT INTO positions (
  slug,
  name,
  description,
  highlights,
  evaluation_dimensions,
  default_difficulty,
  default_question_count
)
VALUES
  (
    'java-backend-engineer',
    'Java 后端工程师',
    '面向后端岗位的模拟面试，覆盖 Java、分布式系统、数据存储以及生产环境中的技术权衡。',
    'Spring Boot,MySQL,Redis,消息队列,系统设计',
    '技术准确性,知识深度,表达沟通,岗位匹配度',
    'intermediate',
    4
  ),
  (
    'web-frontend-engineer',
    'Web 前端工程师',
    '面向前端岗位的模拟面试，覆盖浏览器原理、框架工程化、性能优化与线上排障。',
    '浏览器渲染,Vue 或 React,性能优化,工程质量',
    '技术准确性,知识深度,表达沟通,岗位匹配度',
    'intermediate',
    4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  highlights = EXCLUDED.highlights,
  evaluation_dimensions = EXCLUDED.evaluation_dimensions,
  default_difficulty = EXCLUDED.default_difficulty,
  default_question_count = EXCLUDED.default_question_count,
  updated_at = now();

INSERT INTO questions (
  position_id,
  type,
  difficulty,
  content,
  topic,
  expected_keywords,
  follow_up_hints,
  evaluation_focus,
  rubric,
  is_active
)
SELECT
  p.id,
  v.type,
  v.difficulty,
  v.content,
  v.topic,
  v.expected_keywords,
  v.follow_up_hints,
  v.evaluation_focus,
  v.rubric,
  true
FROM positions p
JOIN (
  VALUES
    (
      'java-backend-engineer',
      'technical',
      'intermediate',
      '在高并发系统中，你会如何处理 Redis 与 MySQL 之间的缓存一致性问题？',
      '缓存一致性',
      '缓存失效,延迟双删,重试,数据库一致性,热点 Key',
      '故障处理,重试时机,热点 Key 保护',
      'Redis,MySQL,系统设计',
      '需要给出具体的一致性方案，说明失败路径，并讨论在高流量下的缓解手段。'
    ),
    (
      'java-backend-engineer',
      'project',
      'intermediate',
      '选择一个你做过的后端项目，说明整体架构、遇到的瓶颈，以及你是如何定位并解决这些问题的。',
      '项目深挖',
      '架构,瓶颈,指标,权衡,优化',
      '如何衡量效果,为什么这个方案合适',
      '系统设计,表达沟通',
      '重点考察候选人的负责范围、推理过程、指标意识，以及是否能把技术选择和结果关联起来。'
    ),
    (
      'java-backend-engineer',
      'scenario',
      'intermediate',
      '订单服务突然流量暴涨，下游依赖开始超时。你会先做什么？又会如何一步步把系统稳定下来？',
      '订单突增场景',
      '限流,降级,队列,超时,监控',
      '稳定顺序,可观测性,回滚策略',
      '消息队列,系统设计',
      '重点看是否具备明确的优先级、隔离思路、可观测性意识，以及分阶段恢复方案。'
    ),
    (
      'java-backend-engineer',
      'behavioral',
      'intermediate',
      '讲一个你因为可靠性或可扩展性风险，而对后端需求提出异议并推动调整的经历。',
      '跨团队沟通',
      '风险,权衡,干系人,沟通,结果',
      '你如何影响决策,你使用了哪些数据',
      '表达沟通,岗位匹配度',
      '重点看背景是否清晰、决策标准是否明确，以及是否能体现与干系人的沟通能力。'
    ),
    (
      'web-frontend-engineer',
      'technical',
      'intermediate',
      '请你说明浏览器如何把 HTML、CSS 和 JavaScript 转换成最终屏幕上的像素，以及性能问题通常出现在什么阶段。',
      '渲染流水线',
      'DOM,CSSOM,渲染树,布局,绘制',
      '重排原因,JavaScript 的影响,性能分析',
      '浏览器渲染,性能优化',
      '重点考察是否能清晰解释渲染流水线，以及是否了解常见性能瓶颈。'
    ),
    (
      'web-frontend-engineer',
      'project',
      'intermediate',
      '选择一个你做过的前端项目，介绍架构设计、协作方式，以及你做过的最大一次工程权衡。',
      '前端项目深挖',
      '架构,状态管理,权衡,协作,交付',
      '架构如何演进,质量控制手段',
      '工程质量,表达沟通',
      '重点看是否具备系统性思考、项目主人翁意识，以及如何平衡质量与交付速度。'
    ),
    (
      'web-frontend-engineer',
      'scenario',
      'intermediate',
      '一个核心页面在新版本发布后明显变慢了。你会如何排查，并最终修复这个问题？',
      '页面性能变慢',
      '性能分析,构建产物,瀑布流,渲染,回归',
      '测量方案,回滚标准,如何防止再次发生',
      '性能优化,工程质量',
      '重点看是否有假设驱动的排查流程，以及对回滚和修复之间权衡的理解。'
    ),
    (
      'web-frontend-engineer',
      'behavioral',
      'intermediate',
      '描述一次你推动前端工程改进，但产品或设计最初并不优先支持的经历。',
      '推动产品范围调整',
      '影响力,权衡,用户影响,沟通,结果',
      '你如何定义问题,你如何衡量影响',
      '表达沟通,岗位匹配度',
      '重点看干系人管理、优先级判断，以及最终结果是否和用户价值或团队效率相关。'
    )
) AS v(
  position_slug,
  type,
  difficulty,
  content,
  topic,
  expected_keywords,
  follow_up_hints,
  evaluation_focus,
  rubric
) ON p.slug = v.position_slug
ON CONFLICT (position_id, topic) DO UPDATE SET
  type = EXCLUDED.type,
  difficulty = EXCLUDED.difficulty,
  content = EXCLUDED.content,
  expected_keywords = EXCLUDED.expected_keywords,
  follow_up_hints = EXCLUDED.follow_up_hints,
  evaluation_focus = EXCLUDED.evaluation_focus,
  rubric = EXCLUDED.rubric,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO knowledge_snippets (
  position_id,
  title,
  summary,
  content,
  tags,
  difficulty
)
SELECT
  p.id,
  v.title,
  v.summary,
  v.content,
  v.tags,
  v.difficulty
FROM positions p
JOIN (
  VALUES
    (
      'java-backend-engineer',
      '缓存与数据库一致性模式',
      '总结在高写入压力下保持 Redis 与 MySQL 数据一致的常见方案。',
      '覆盖缓存失效时机、延迟双删、幂等重试、热点 Key 保护，以及上线后需要重点关注的监控项。',
      '缓存失效,Redis,MySQL,重试,热点 Key',
      'intermediate'
    ),
    (
      'java-backend-engineer',
      '流量突增稳定性处置手册',
      '面向过载与下游超时场景的实战处理流程。',
      '优先关注可观测性、限流、优雅降级、队列缓冲、超时预算、熔断策略以及回滚触发条件。',
      '限流,队列,超时,监控,降级',
      'intermediate'
    ),
    (
      'java-backend-engineer',
      '后端项目讲述方法',
      '帮助候选人在项目面试中讲清负责范围、瓶颈与可量化结果。',
      '建议按项目背景、系统架构、性能瓶颈、衡量指标、技术权衡、实施过程和最终结果来组织表达。',
      '架构,瓶颈,指标,权衡',
      'intermediate'
    ),
    (
      'web-frontend-engineer',
      '浏览器渲染瓶颈',
      '快速回顾渲染流水线，以及页面变慢时最常见的原因。',
      '梳理 DOM、CSSOM、渲染树、布局、绘制、合成、主线程阻塞，以及强制重排在性能分析工具中的表现。',
      'DOM,CSSOM,渲染树,布局,绘制',
      'intermediate'
    ),
    (
      'web-frontend-engineer',
      '性能回归排查流程',
      '提供一条从问题出现到回滚或修复的前端性能排查路径。',
      '先建立基线，再检查构建产物变化、对比网络瀑布流、分析渲染过程、隔离回归点，并补上防止复发的措施。',
      '性能分析,构建产物,瀑布流,回归,渲染',
      'intermediate'
    ),
    (
      'web-frontend-engineer',
      '前端项目面试表达框架',
      '帮助候选人更有条理地讲清前端项目中的架构与协作决策。',
      '可以围绕系统架构、状态策略、与产品和设计的协作方式、发布时间约束、质量门禁以及最终方案背后的权衡来展开。',
      '架构,状态管理,协作,权衡',
      'intermediate'
    )
) AS v(
  position_slug,
  title,
  summary,
  content,
  tags,
  difficulty
) ON p.slug = v.position_slug
ON CONFLICT (position_id, title) DO UPDATE SET
  summary = EXCLUDED.summary,
  content = EXCLUDED.content,
  tags = EXCLUDED.tags,
  difficulty = EXCLUDED.difficulty,
  updated_at = now();
