<template>
  <div class="page-shell">
    <header class="topbar">
      <div class="brand">Interview Arena</div>
      <nav class="nav-links">
        <a href="#tracks">岗位训练</a>
        <a href="#simulation">模拟面试</a>
        <a href="#reports">报告分析</a>
        <a href="#growth">成长记录</a>
      </nav>
      <div class="topbar-actions">
        <n-button quaternary>登录</n-button>
        <n-button type="warning">开始训练</n-button>
      </div>
    </header>

    <main class="page-content">
      <section class="hero-section">
        <div class="hero-copy">
          <p class="eyebrow">AI Mock Interview Platform</p>
          <h1>像 LeetCode 一样高频训练，但目标是拿下面试。</h1>
          <p class="hero-summary">
            题库、知识库、模拟面试、追问、评估报告和成长曲线组成完整闭环。先把训练入口、产品感和平台气质做对。
          </p>

          <div class="hero-actions">
            <n-button type="warning" size="large">进入模拟面试</n-button>
            <n-button ghost color="#7A828E" size="large">查看岗位题库</n-button>
          </div>

          <div class="hero-stats">
            <div class="stat-card">
              <strong>2</strong>
              <span>首发岗位</span>
            </div>
            <div class="stat-card">
              <strong>120+</strong>
              <span>训练题模板</span>
            </div>
            <div class="stat-card">
              <strong>4</strong>
              <span>评分维度</span>
            </div>
          </div>
        </div>

        <div class="hero-panel">
          <div class="hero-panel-head">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <div class="hero-panel-body">
            <n-card class="daily-card" :bordered="false">
              <template #header>
                <div class="card-title-row">
                  <span>今日挑战</span>
                  <n-tag round type="warning" size="small">Java 后端</n-tag>
                </div>
              </template>
              <h3>缓存一致性与高并发场景专项</h3>
              <p>混合技术题、项目题、场景题，训练真实追问节奏。</p>
            </n-card>

            <n-card class="score-card" :bordered="false">
              <div class="score-row">
                <span>技术正确性</span>
                <strong>83</strong>
              </div>
              <div class="score-row">
                <span>逻辑表达</span>
                <strong>76</strong>
              </div>
              <div class="score-row">
                <span>岗位匹配</span>
                <strong>81</strong>
              </div>
            </n-card>

            <div class="chat-preview">
              <div class="bubble interviewer">你刚才提到了缓存击穿，那热点 key 失效时你具体怎么保护数据库？</div>
              <div class="bubble candidate">我会先识别热点数据，再结合互斥锁、逻辑过期和限流做保护。</div>
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" class="content-section">
        <div class="section-head">
          <h2>岗位训练</h2>
          <a href="/">查看全部</a>
        </div>

        <div class="track-grid">
          <n-card class="track-card" :bordered="false">
            <div class="track-header">
              <span class="track-badge orange">J</span>
              <n-tag round size="small">中级</n-tag>
            </div>
            <h3>Java 后端</h3>
            <p>Spring Boot、MySQL、Redis、消息队列、系统设计与项目深挖。</p>
            <div class="track-tags">
              <n-tag round>技术题</n-tag>
              <n-tag round>项目题</n-tag>
              <n-tag round>场景题</n-tag>
            </div>
          </n-card>

          <n-card class="track-card" :bordered="false">
            <div class="track-header">
              <span class="track-badge blue">F</span>
              <n-tag round size="small">中级</n-tag>
            </div>
            <h3>Web 前端</h3>
            <p>浏览器、Vue/React、性能优化、工程化、线上故障排查。</p>
            <div class="track-tags">
              <n-tag round>技术题</n-tag>
              <n-tag round>项目题</n-tag>
              <n-tag round>行为题</n-tag>
            </div>
          </n-card>

          <n-card class="track-card accent-card" :bordered="false">
            <div class="track-header">
              <span class="track-badge green">AI</span>
              <n-tag round size="small" type="warning">推荐</n-tag>
            </div>
            <h3>个性化训练计划</h3>
            <p>根据历史面试结果自动识别薄弱点，推荐专项练习和复盘路径。</p>
            <div class="track-tags">
              <n-tag round>成长曲线</n-tag>
              <n-tag round>追问优化</n-tag>
              <n-tag round>提升建议</n-tag>
            </div>
          </n-card>
        </div>
      </section>

      <section id="simulation" class="content-section split-section">
        <n-card class="feature-card" :bordered="false">
          <template #header>
            <h2>模拟面试</h2>
          </template>
          <ul class="feature-list">
            <li>岗位驱动的题库，不是泛聊天。</li>
            <li>回答过短、过浅或偏题时自动追问。</li>
            <li>技术题、项目题、场景题、行为题混合编排。</li>
            <li>后续接语音输入、表达分析与真实报告流。</li>
          </ul>
        </n-card>

        <n-card class="feature-card feature-card-highlight" :bordered="false">
          <template #header>
            <h2>训练路径</h2>
          </template>
          <div class="timeline">
            <div class="timeline-item">
              <span>01</span>
              <div>
                <strong>选择岗位</strong>
                <p>进入前端或 Java 后端专项训练。</p>
              </div>
            </div>
            <div class="timeline-item">
              <span>02</span>
              <div>
                <strong>多轮问答</strong>
                <p>模拟真实面试节奏，每题支持追问。</p>
              </div>
            </div>
            <div class="timeline-item">
              <span>03</span>
              <div>
                <strong>生成报告</strong>
                <p>给出结构化评估与后续训练建议。</p>
              </div>
            </div>
          </div>
        </n-card>
      </section>

      <section id="reports" class="content-section">
        <div class="section-head">
          <h2>报告与成长</h2>
        </div>
        <div class="report-grid">
          <n-card class="report-card" :bordered="false">
            <h3>结构化评估报告</h3>
            <p>从技术正确性、知识深度、表达逻辑、岗位匹配度多个方向分析表现。</p>
          </n-card>
          <n-card class="report-card" :bordered="false">
            <h3>针对性改进建议</h3>
            <p>自动指出缺失知识点、薄弱题型与下一次练习重点。</p>
          </n-card>
          <n-card class="report-card" :bordered="false">
            <h3>成长曲线</h3>
            <p>沉淀每次训练的分数和维度变化，形成长期能力趋势。</p>
          </n-card>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NTag } from "naive-ui";
</script>
