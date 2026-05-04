/* ─────────────────────────────────────────────────────────────────────────
   script.js — SRS Estimator Frontend Logic
   ───────────────────────────────────────────────────────────────────────── */

const SAMPLE_SRS = `The system shall provide secure user authentication using JWT tokens and OAuth 2.0 with two-factor authentication (2FA). It shall include a real-time analytics dashboard for monitoring key performance metrics using WebSocket technology. The platform must feature an AI-based recommendation engine powered by machine learning algorithms. Payment gateway integration with Razorpay shall handle billing and invoicing. An admin panel with role-based access control (RBAC) and audit trail shall be provided. The system shall support cloud storage on AWS S3 with CDN integration, automated email and SMS notifications via third-party APIs, and a full-text search and filter system. Data must be encrypted at rest and in transit (SSL/TLS). A RESTful API shall be exposed for third-party integrations. Automated backup and recovery must be included.`;

// ── Helpers ──────────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Tab Switching ────────────────────────────────────────────────────────

window.switchTab = function (tab) {
  const phaseEl = $('phaseTimeline');
  const moduleEl = $('moduleTimeline');
  const tabPhase = $('tabPhase');
  const tabModule = $('tabModule');

  if (tab === 'phase') {
    phaseEl.classList.remove('hidden');
    moduleEl.classList.add('hidden');
    tabPhase.classList.add('active');
    tabModule.classList.remove('active');
  } else {
    moduleEl.classList.remove('hidden');
    phaseEl.classList.add('hidden');
    tabModule.classList.add('active');
    tabPhase.classList.remove('active');
  }
};

// ── Keywords Toggle ───────────────────────────────────────────────────────

function setupKeywordsToggle() {
  const btn = $('toggleKeywordsBtn');
  const content = $('keywordsContent');
  let visible = false;

  btn.addEventListener('click', () => {
    visible = !visible;
    if (visible) {
      content.classList.remove('hidden');
      btn.textContent = 'Hide Keywords';
    } else {
      content.classList.add('hidden');
      btn.textContent = 'Show Keywords';
    }
  });
}

// ── Render Functions ─────────────────────────────────────────────────────

function renderStats(data) {
  $('statModules').textContent = data.num_modules;
  $('statDays').textContent = data.total_days;
  $('statHours').textContent = data.total_hours + ' hrs';
  $('statCost').textContent = formatINR(data.total_cost);
  $('statComplexity').textContent = data.keywords.overall_complexity_score + '/100';
}

function renderKeywords(kw) {
  // Feature tags
  const featureContainer = $('featureTags');
  featureContainer.innerHTML = '';
  if (kw.feature_keywords.length === 0) {
    featureContainer.innerHTML = '<span style="font-size:0.78rem;color:#aaa;">None detected</span>';
  } else {
    kw.feature_keywords.forEach(f => {
      const tag = document.createElement('span');
      tag.className = 'tag tag-feature';
      tag.textContent = f;
      featureContainer.appendChild(tag);
    });
  }

  // Complexity tags
  const complexContainer = $('complexityTags');
  complexContainer.innerHTML = '';
  if (kw.complexity_keywords.length === 0) {
    complexContainer.innerHTML = '<span style="font-size:0.78rem;color:#aaa;">None detected</span>';
  } else {
    kw.complexity_keywords.forEach(c => {
      const tag = document.createElement('span');
      tag.className = 'tag tag-complex';
      const levelSpan = document.createElement('span');
      levelSpan.className = 'tag-level';
      levelSpan.textContent = c.level;
      tag.textContent = c.keyword + ' ';
      tag.appendChild(levelSpan);
      complexContainer.appendChild(tag);
    });
  }

  // Complexity bar
  const pct = kw.overall_complexity_score;
  $('complexityBarFill').style.width = pct + '%';
  $('complexityBarPct').textContent = pct + '%';
}

function renderCost(data) {
  $('laborCost').textContent = formatINR(data.labor_cost);
  $('laborSub').textContent = `${data.total_hours} hrs × ${formatINR(data.hourly_rate)}/hr`;
  $('infraCost').textContent = formatINR(data.infrastructure_cost);
  $('contingencyCost').textContent = formatINR(data.contingency);
  $('totalCostDisplay').textContent = formatINR(data.total_cost);

  // Cost bar chart
  const total = data.total_cost;
  const items = [
    { name: 'Labor Cost', value: data.labor_cost, color: '#2c5f9e' },
    { name: 'Infrastructure', value: data.infrastructure_cost, color: '#5b8fc9' },
    { name: 'Contingency', value: data.contingency, color: '#8ab0d8' },
  ];

  const barsContainer = $('costBars');
  barsContainer.innerHTML = '';
  items.forEach(item => {
    const pct = Math.round((item.value / total) * 100);
    barsContainer.innerHTML += `
      <div class="cost-bar-row">
        <div class="cost-bar-name">${item.name}</div>
        <div class="cost-bar-track">
          <div class="cost-bar-fill" style="width:${pct}%;background:${item.color};"></div>
        </div>
        <div class="cost-bar-pct">${pct}%</div>
      </div>
    `;
  });
}

function renderTimeline(data) {
  // Date range badge
  $('dateRangeBadge').textContent = `${formatDate(data.start_date)} → ${formatDate(data.end_date)}`;

  // Phase Gantt
  const maxPhaseDays = Math.max(...data.phase_timeline.map(p => p.days));
  const phaseGantt = $('phaseGantt');
  phaseGantt.innerHTML = '';
  data.phase_timeline.forEach(phase => {
    const widthPct = Math.max(4, Math.round((phase.days / maxPhaseDays) * 100));
    phaseGantt.innerHTML += `
      <div class="gantt-row">
        <div class="gantt-phase-name">${phase.emoji || ''} ${phase.name}</div>
        <div class="gantt-dates">${formatDate(phase.start_date)} – ${formatDate(phase.end_date)}</div>
        <div class="gantt-days">${phase.days}d</div>
        <div class="gantt-bar-wrap">
          <div class="gantt-bar bar-phase" style="width:${widthPct}%"></div>
        </div>
      </div>
    `;
  });

  // Module Gantt
  const totalModuleDays = data.total_days;
  const moduleGantt = $('moduleGantt');
  moduleGantt.innerHTML = '';
  data.module_timeline.forEach(mod => {
    const widthPct = Math.max(2, Math.round((mod.days / totalModuleDays) * 100));
    const barClass = `bar-${mod.complexity || 'phase'}`;
    moduleGantt.innerHTML += `
      <div class="gantt-row">
        <div class="gantt-phase-name">${mod.name}</div>
        <div class="gantt-dates">${formatDate(mod.start_date)} – ${formatDate(mod.end_date)}</div>
        <div class="gantt-days">${mod.days}d</div>
        <div class="gantt-bar-wrap">
          <div class="gantt-bar ${barClass}" style="width:${widthPct}%"></div>
        </div>
      </div>
    `;
  });
}

function renderModules(data) {
  $('moduleCountBadge').textContent = data.num_modules + ' modules';
  const tbody = $('moduleTableBody');
  tbody.innerHTML = '';
  data.modules.forEach((mod, i) => {
    tbody.innerHTML += `
      <tr>
        <td style="color:var(--text-muted);font-size:0.75rem;">${i + 1}</td>
        <td><strong>${mod.name}</strong></td>
        <td><span class="badge badge-${mod.complexity}">${mod.complexity}</span></td>
        <td style="color:var(--text-muted);">×${mod.multiplier}</td>
        <td><strong>${mod.days}d</strong></td>
      </tr>
    `;
  });
}

function renderTeam(data) {
  const team = data.team;
  $('teamSizeBadge').textContent = team.size + ' — ' + team.total + ' people';

  const roles = [
    { title: 'Developers', count: team.developers, icon: '💻' },
    { title: 'Designers', count: team.designers, icon: '🎨' },
    { title: 'QA Engineers', count: team.qa, icon: '🧪' },
    { title: 'DevOps', count: team.devops, icon: '⚙️' },
    { title: 'Project Manager', count: team.pm, icon: '📋' },
  ];

  const grid = $('teamGrid');
  grid.innerHTML = '';
  roles.forEach(r => {
    grid.innerHTML += `
      <div class="team-role-card">
        <div style="font-size:1.4rem;margin-bottom:0.3rem;">${r.icon}</div>
        <div class="team-role-count">${r.count}</div>
        <div class="team-role-title">${r.title}</div>
      </div>
    `;
  });

  $('teamDesc').textContent = team.description;
}

// ── Main Estimate Flow ────────────────────────────────────────────────────

async function runEstimate() {
  const text = $('srsInput').value.trim();
  const hourlyRate = parseFloat($('hourlyRate').value) || 500;
  const startDate = $('startDate').value || null;

  if (!text || text.length < 10) {
    alert('Please paste a valid SRS document (at least 10 characters).');
    return;
  }

  // Set loading state
  $('btnText').classList.add('hidden');
  $('btnSpinner').classList.remove('hidden');
  $('estimateBtn').disabled = true;

  try {
    const response = await fetch('/api/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, hourly_rate: hourlyRate, start_date: startDate }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'API error');
    }

    const data = await response.json();

    // Render all sections
    renderStats(data);
    renderKeywords(data.keywords);
    renderCost(data);
    renderTimeline(data);
    renderModules(data);
    renderTeam(data);

    // Show results
    $('resultsContainer').classList.remove('hidden');

    // Scroll to results
    setTimeout(() => {
      $('resultsContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  } catch (err) {
    console.error(err);
    alert('Error: ' + err.message + '\n\nMake sure the backend server is running on port 8000.');
  } finally {
    $('btnText').classList.remove('hidden');
    $('btnSpinner').classList.add('hidden');
    $('estimateBtn').disabled = false;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Set today as default start date
  const today = new Date().toISOString().split('T')[0];
  $('startDate').value = today;

  // Demo button
  $('demoBtn').addEventListener('click', () => {
    $('srsInput').value = SAMPLE_SRS;
  });

  // Estimate button
  $('estimateBtn').addEventListener('click', runEstimate);

  // Keywords toggle
  setupKeywordsToggle();

  // Active nav highlight on scroll
  const navLinks = document.querySelectorAll('.nav-item');
  const sections = ['inputSection', 'keywordsSection', 'costSection', 'timelineSection', 'modulesSection', 'teamSection'];

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => link.classList.remove('active'));
        const active = document.querySelector(`#nav-${entry.target.id.replace('Section', '')}`);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
});
