document.addEventListener('DOMContentLoaded', () => {
  // ─── Session Check ──────────────────────────────────────
  if (localStorage.getItem(CMS_CONFIG.SESSION_KEY) !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  // ─── State ──────────────────────────────────────────────
  let cmsData = {};
  let chartInstances = {};
  let autoSaveEnabled = localStorage.getItem('cms_autosave') !== 'false';
  let notifCount = 0;
  let notifications = JSON.parse(localStorage.getItem('cms_notifications') || '[]');

  // ─── Elements ───────────────────────────────────────────
  const tabs        = document.querySelectorAll('.section');
  const navItems    = document.querySelectorAll('.nav-item');
  const fileLoader  = document.getElementById('file-loader');
  const btnLoad     = document.getElementById('btn-load');
  const btnSave     = document.getElementById('btn-save');
  const toast       = document.getElementById('toast');
  const btnLogout   = document.getElementById('btn-logout');
  const topbarTitle = document.getElementById('topbar-title');
  const mobileToggle= document.getElementById('menu-btn');
  const sidebar     = document.querySelector('.sidebar');

  // Notification elements
  const notifBtn    = document.getElementById('notif-btn');
  const notifPanel  = document.getElementById('notif-panel');
  const notifOverlay= document.getElementById('notif-overlay');
  const closeNotif  = document.getElementById('close-notif');
  const clearNotifs = document.getElementById('clear-notifs');
  const notifBadge  = document.getElementById('notif-badge');
  const notifList   = document.getElementById('notif-list');

  // Search elements
  const searchBtn   = document.getElementById('topbar-search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchInput  = document.getElementById('search-input');
  const searchResults= document.getElementById('search-results');

  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');

  // Settings
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnLoadSettings = document.getElementById('btn-load-settings');
  const btnClearCache   = document.getElementById('btn-clear-cache');

  // Default Data Template
  const defaultData = {
    meta: { title: '', description: '', keywords: '' },
    profile: { name: '', image: '', availabilityBadge: '', social: { github: '', twitter: '', linkedin: '', whatsapp: '' } },
    hero: { backgroundImage: '', badge: '', heading: '', typedItems: [], ctaPrimary: { label: '', icon: '', href: '' }, ctaOutline: { label: '', icon: '', href: '' } },
    about: { sectionSubtitle: '', heading: '', intro: '', body: '', image: '', info: { location: '', phone: '', city: '', specialisation: '', email: '', freelance: '' } },
    stats: [{ icon: '', end: 0, label: '', sublabel: '' }, { icon: '', end: 0, label: '', sublabel: '' }, { icon: '', end: 0, label: '', sublabel: '' }, { icon: '', end: 0, label: '', sublabel: '' }],
    skills: { sectionSubtitle: '', bars: [], badges: [] },
    resume: { sectionSubtitle: '', summary: { name: '', description: '', location: '', phone: '', email: '' }, education: [], notableProjects: [], experience: [] },
    portfolio: [],
    portfolioFilters: [],
    services: [],
    testimonials: [],
    contact: { location: '', phone: '', email: '', github: '', formAction: '', sectionSubtitle: '' },
    footer: { copyright: '', credits: '', githubUrl: '', githubLabel: '' },
    blog: []
  };

  // ─── Init ────────────────────────────────────────────────
  init();

  function init() {
    setupNavigation();
    setupFileHandling();
    setupNotifications();
    setupSearch();
    setupThemeToggle();
    setupKeyboardShortcuts();
    setupSettings();
    setupOverviewClicks();

    // Load cached data
    const saved = localStorage.getItem(CMS_CONFIG.DATA_KEY);
    if (saved) {
      try {
        cmsData = deepMerge(JSON.parse(JSON.stringify(defaultData)), JSON.parse(saved));
        populateForm(cmsData);
        populateOverview(cmsData);
        logActivity('📂', 'Loaded cached data from browser storage');
        showToast('Loaded cached data', 'info');
      } catch (e) {
        cmsData = JSON.parse(JSON.stringify(defaultData));
      }
    } else {
      cmsData = JSON.parse(JSON.stringify(defaultData));
    }

    setupDropZones();
    setupDynamicLists();
    updateNotifBadge();
    renderNotifications();

    // Load saved theme
    const savedTheme = localStorage.getItem('cms_theme') || 'dark';
    applyTheme(savedTheme);

    // Load saved accent
    const savedAccent = localStorage.getItem('cms_accent');
    if (savedAccent) applyAccent(savedAccent);

    // Auto-save toggle state
    const autoSaveEl = document.getElementById('settings-autosave');
    if (autoSaveEl) autoSaveEl.checked = autoSaveEnabled;
  }

  // ─────────────────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────────────────
  const NAV_LABELS = {
    overview: 'Overview', analytics: 'Analytics', media: 'Media Library',
    blog: 'Blog Posts', meta: 'Meta / SEO', profile: 'Profile',
    hero: 'Hero', about: 'About', stats: 'Stats', skills: 'Skills',
    resume: 'Resume', portfolio: 'Portfolio', services: 'Services',
    testimonials: 'Testimonials', contact: 'Contact', footer: 'Footer',
    settings: 'Settings'
  };

  const NAV_ICONS = {
    overview: '🏠', analytics: '📊', media: '🖼', blog: '📝',
    meta: '🌐', profile: '👤', hero: '⚡', about: 'ℹ',
    stats: '📈', skills: '💡', resume: '📄', portfolio: '🗂',
    services: '🛠', testimonials: '💬', contact: '📧', footer: '▾', settings: '⚙️'
  };

  function navigateTo(tabId) {
    navItems.forEach(nav => nav.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));

    const matchNav = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const matchTab = document.querySelector(`.section[data-tab="${tabId}"]`);

    if (matchNav) matchNav.classList.add('active');
    if (matchTab) matchTab.classList.add('active');

    if (topbarTitle) topbarTitle.textContent = NAV_LABELS[tabId] || tabId;

    if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');

    // Render analytics charts when analytics tab is visited
    if (tabId === 'analytics') setTimeout(() => renderCharts(), 100);
    if (tabId === 'media') renderMediaLibrary();
  }

  function setupNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navigateTo(item.getAttribute('data-tab'));
      });
    });

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
  }

  function setupOverviewClicks() {
    // Stat cards on overview
    document.querySelectorAll('.ov-stat-card[data-nav]').forEach(card => {
      card.addEventListener('click', () => navigateTo(card.dataset.nav));
    });
    // Quick action buttons
    document.querySelectorAll('.quick-action[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => navigateTo(btn.dataset.nav));
    });
    // Card header "View all" buttons
    document.querySelectorAll('[data-nav]').forEach(el => {
      if (!el.classList.contains('ov-stat-card') && !el.classList.contains('quick-action')) {
        el.addEventListener('click', () => navigateTo(el.dataset.nav));
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // FILE HANDLING
  // ─────────────────────────────────────────────────────────
  function setupFileHandling() {
    btnLoad.addEventListener('click', () => fileLoader.click());
    fileLoader.addEventListener('change', handleFileLoad);
    btnSave.addEventListener('click', saveAndDownload);
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem(CMS_CONFIG.SESSION_KEY);
        window.location.href = 'index.html';
      });
    }
  }

  function handleFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        cmsData = deepMerge(JSON.parse(JSON.stringify(defaultData)), data);
        localStorage.setItem(CMS_CONFIG.DATA_KEY, JSON.stringify(cmsData));
        populateForm(cmsData);
        populateOverview(cmsData);
        logActivity('📂', `Loaded ${file.name}`);
        showToast('Successfully loaded data.json ✓');
      } catch (err) {
        showToast('Invalid JSON file', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ─────────────────────────────────────────────────────────
  // POPULATE FORM
  // ─────────────────────────────────────────────────────────
  function populateForm(data) {
    // Meta
    setVal('meta-title', data.meta?.title);
    setVal('meta-description', data.meta?.description);
    setVal('meta-keywords', data.meta?.keywords);

    // Profile
    setVal('profile-name', data.profile?.name);
    setVal('profile-availability-badge', data.profile?.availabilityBadge);
    setImageDropzone('profile-image', data.profile?.image);
    setVal('social-github', data.profile?.social?.github);
    setVal('social-twitter', data.profile?.social?.twitter);
    setVal('social-linkedin', data.profile?.social?.linkedin);
    setVal('social-whatsapp', data.profile?.social?.whatsapp);

    // Hero
    setImageDropzone('hero-bg', data.hero?.backgroundImage);
    setVal('hero-badge', data.hero?.badge);
    setVal('hero-heading', data.hero?.heading);
    setVal('hero-typed-items', (data.hero?.typedItems || []).join('\n'));
    setVal('hero-cta-primary-label', data.hero?.ctaPrimary?.label);
    setVal('hero-cta-primary-icon', data.hero?.ctaPrimary?.icon);
    setVal('hero-cta-primary-href', data.hero?.ctaPrimary?.href);
    setVal('hero-cta-outline-label', data.hero?.ctaOutline?.label);
    setVal('hero-cta-outline-icon', data.hero?.ctaOutline?.icon);
    setVal('hero-cta-outline-href', data.hero?.ctaOutline?.href);

    // About
    setVal('about-section-subtitle', data.about?.sectionSubtitle);
    setVal('about-heading', data.about?.heading);
    setVal('about-intro', data.about?.intro);
    setVal('about-body', data.about?.body);
    setImageDropzone('about-image', data.about?.image);
    setVal('about-location', data.about?.info?.location);
    setVal('about-phone', data.about?.info?.phone);
    setVal('about-city', data.about?.info?.city);
    setVal('about-specialisation', data.about?.info?.specialisation);
    setVal('about-email', data.about?.info?.email);
    setVal('about-freelance', data.about?.info?.freelance);

    // Stats (fixed 4)
    if (data.stats && Array.isArray(data.stats)) {
      for (let i = 0; i < 4; i++) {
        const stat = data.stats[i] || { icon: '', end: 0, label: '', sublabel: '' };
        setVal(`stat-${i}-icon`, stat.icon);
        setVal(`stat-${i}-end`, stat.end);
        setVal(`stat-${i}-label`, stat.label);
        setVal(`stat-${i}-sublabel`, stat.sublabel);
      }
    }

    // Skills
    setVal('skills-section-subtitle', data.skills?.sectionSubtitle);
    renderList('skills-bars-list', data.skills?.bars || [], renderSkillBar);
    renderList('skills-badges-list', data.skills?.badges || [], renderSkillBadge);

    // Resume
    setVal('resume-section-subtitle', data.resume?.sectionSubtitle);
    setVal('resume-summary-name', data.resume?.summary?.name);
    setVal('resume-summary-description', data.resume?.summary?.description);
    setVal('resume-summary-location', data.resume?.summary?.location);
    setVal('resume-summary-phone', data.resume?.summary?.phone);
    setVal('resume-summary-email', data.resume?.summary?.email);
    renderList('resume-education-list', data.resume?.education || [], renderEducation);
    renderList('resume-projects-list', data.resume?.notableProjects || [], renderNotableProject);
    renderList('resume-experience-list', data.resume?.experience || [], renderExperience);

    // Portfolio
    renderList('portfolio-filters-list', data.portfolioFilters || [], renderPortfolioFilter);
    renderList('portfolio-items-list', data.portfolio || [], renderPortfolioItem, true);

    // Services
    renderList('services-list', data.services || [], renderService);

    // Testimonials
    renderList('testimonials-list', data.testimonials || [], renderTestimonial);

    // Contact
    setVal('contact-subtitle', data.contact?.sectionSubtitle);
    setVal('contact-location', data.contact?.location);
    setVal('contact-phone', data.contact?.phone);
    setVal('contact-email', data.contact?.email);
    setVal('contact-github', data.contact?.github);
    setVal('contact-form-action', data.contact?.formAction);

    // Footer
    setVal('footer-copyright', data.footer?.copyright);
    setVal('footer-credits', data.footer?.credits);
    setVal('footer-github-url', data.footer?.githubUrl);
    setVal('footer-github-label', data.footer?.githubLabel);

    // Blog
    renderBlogList(data.blog || []);

    // Update topbar avatar
    updateAvatar(data.profile?.name);

    // Update overview last saved
    const ovLastSaved = document.getElementById('overview-last-saved');
    if (ovLastSaved) {
      const now = new Date().toLocaleString();
      ovLastSaved.textContent = `Last loaded: ${now}`;
    }
  }

  // ─────────────────────────────────────────────────────────
  // OVERVIEW
  // ─────────────────────────────────────────────────────────
  function populateOverview(data) {
    setText('ov-projects', (data.portfolio || []).length);
    setText('ov-skills', (data.skills?.bars || []).length + (data.skills?.badges || []).length);
    setText('ov-testimonials', (data.testimonials || []).length);
    setText('ov-services', (data.services || []).length);
    setText('ov-blog', (data.blog || []).length);
    setText('ov-experience', (data.resume?.experience || []).length);

    // Project grid
    const grid = document.getElementById('ov-project-grid');
    if (grid) {
      const projects = (data.portfolio || []).slice(0, 6);
      if (projects.length === 0) {
        grid.innerHTML = '<div class="ov-empty" style="grid-column:1/-1">No projects yet — go to Portfolio to add some.</div>';
      } else {
        grid.innerHTML = projects.map(p => `
          <div class="ov-project-thumb" onclick="void(0)">
            ${p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" loading="lazy">` : `<div class="ov-project-placeholder">🗂</div>`}
            <div class="ov-project-thumb-label">${escapeHtml(p.title)}</div>
          </div>
        `).join('');
      }
    }

    // Skills top 5
    const skillsList = document.getElementById('ov-skills-list');
    if (skillsList) {
      const topSkills = (data.skills?.bars || []).slice(0, 5);
      if (topSkills.length === 0) {
        skillsList.innerHTML = '<div class="ov-empty">No skills yet.</div>';
      } else {
        skillsList.innerHTML = topSkills.map(s => `
          <div class="ov-skill-bar-row">
            <div class="ov-skill-bar-label">
              <span class="ov-skill-bar-name">${escapeHtml(s.name)}</span>
              <span class="ov-skill-bar-val">${s.value}%</span>
            </div>
            <div class="ov-skill-bar-track">
              <div class="ov-skill-bar-fill" style="width:${s.value}%"></div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // SAVE & DOWNLOAD
  // ─────────────────────────────────────────────────────────
  function saveAndDownload() {
    const data = collectFormData();
    localStorage.setItem(CMS_CONFIG.DATA_KEY, JSON.stringify(data));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Update last saved
    const ovLastSaved = document.getElementById('overview-last-saved');
    if (ovLastSaved) ovLastSaved.textContent = `Last saved: ${new Date().toLocaleString()}`;

    logActivity('💾', 'Saved and downloaded data.json');
    showToast('data.json downloaded! Upload it to your site folder.');
    cmsData = data;
    populateOverview(data);
  }

  function collectFormData() {
    return {
      meta: {
        title: getVal('meta-title'),
        description: getVal('meta-description'),
        keywords: getVal('meta-keywords')
      },
      profile: {
        name: getVal('profile-name'),
        availabilityBadge: getVal('profile-availability-badge'),
        image: getVal('profile-image-value'),
        social: {
          github: getVal('social-github'),
          twitter: getVal('social-twitter'),
          linkedin: getVal('social-linkedin'),
          whatsapp: getVal('social-whatsapp')
        }
      },
      hero: {
        backgroundImage: getVal('hero-bg-value'),
        badge: getVal('hero-badge'),
        heading: getVal('hero-heading'),
        typedItems: getVal('hero-typed-items').split('\n').map(s => s.trim()).filter(Boolean),
        ctaPrimary: {
          label: getVal('hero-cta-primary-label'),
          icon: getVal('hero-cta-primary-icon'),
          href: getVal('hero-cta-primary-href')
        },
        ctaOutline: {
          label: getVal('hero-cta-outline-label'),
          icon: getVal('hero-cta-outline-icon'),
          href: getVal('hero-cta-outline-href')
        }
      },
      about: {
        sectionSubtitle: getVal('about-section-subtitle'),
        heading: getVal('about-heading'),
        intro: getVal('about-intro'),
        body: getVal('about-body'),
        image: getVal('about-image-value'),
        info: {
          location: getVal('about-location'),
          phone: getVal('about-phone'),
          city: getVal('about-city'),
          specialisation: getVal('about-specialisation'),
          email: getVal('about-email'),
          freelance: getVal('about-freelance')
        }
      },
      stats: [0, 1, 2, 3].map(i => ({
        icon: getVal(`stat-${i}-icon`),
        end: parseInt(getVal(`stat-${i}-end`)) || 0,
        label: getVal(`stat-${i}-label`),
        sublabel: getVal(`stat-${i}-sublabel`)
      })),
      skills: {
        sectionSubtitle: getVal('skills-section-subtitle'),
        bars: Array.from(document.querySelectorAll('#skills-bars-list .list-item')).map(el => ({
          name: el.querySelector('.skill-name').value,
          value: parseInt(el.querySelector('.skill-value').value) || 0
        })),
        badges: Array.from(document.querySelectorAll('#skills-badges-list .list-item')).map(el => ({
          icon: el.querySelector('.badge-icon').value,
          label: el.querySelector('.badge-label').value
        }))
      },
      resume: {
        sectionSubtitle: getVal('resume-section-subtitle'),
        summary: {
          name: getVal('resume-summary-name'),
          description: getVal('resume-summary-description'),
          location: getVal('resume-summary-location'),
          phone: getVal('resume-summary-phone'),
          email: getVal('resume-summary-email')
        },
        education: Array.from(document.querySelectorAll('#resume-education-list .list-item')).map(el => ({
          degree: el.querySelector('.edu-degree').value,
          year: el.querySelector('.edu-year').value,
          institution: el.querySelector('.edu-inst').value,
          description: el.querySelector('.edu-desc').value
        })),
        notableProjects: Array.from(document.querySelectorAll('#resume-projects-list .list-item')).map(el => ({
          title: el.querySelector('.proj-title').value,
          subtitle: el.querySelector('.proj-subtitle').value,
          meta: el.querySelector('.proj-meta').value,
          description: el.querySelector('.proj-desc').value
        })),
        experience: Array.from(document.querySelectorAll('#resume-experience-list .list-item')).map(el => ({
          title: el.querySelector('.exp-title').value,
          period: el.querySelector('.exp-period').value,
          location: el.querySelector('.exp-location').value,
          bullets: el.querySelector('.exp-bullets').value.split('\n').map(s => s.trim()).filter(Boolean)
        }))
      },
      portfolioFilters: Array.from(document.querySelectorAll('#portfolio-filters-list .list-item')).map(el => ({
        label: el.querySelector('.filter-label').value,
        filter: el.querySelector('.filter-val').value
      })),
      portfolio: Array.from(document.querySelectorAll('#portfolio-items-list .list-item')).map(el => ({
        id: el.getAttribute('data-id') || generateId(),
        title: el.querySelector('.port-title').value,
        description: el.querySelector('.port-desc').value,
        image: el.querySelector('.port-img-val').value,
        url: el.querySelector('.port-url').value,
        gallery: el.querySelector('.port-gallery').value,
        filters: Array.from(el.querySelectorAll('.port-filter-check:checked')).map(cb => cb.value)
      })),
      services: Array.from(document.querySelectorAll('#services-list .list-item')).map((el, idx) => ({
        id: el.getAttribute('data-id') || generateId(),
        icon: el.querySelector('.srv-icon').value,
        title: el.querySelector('.srv-title').value,
        description: el.querySelector('.srv-desc').value,
        delay: idx * 100
      })),
      testimonials: Array.from(document.querySelectorAll('#testimonials-list .list-item')).map(el => ({
        id: el.getAttribute('data-id') || generateId(),
        quote: el.querySelector('.test-quote').value,
        image: el.querySelector('.test-img-val').value,
        name: el.querySelector('.test-name').value,
        role: el.querySelector('.test-role').value
      })),
      contact: {
        sectionSubtitle: getVal('contact-subtitle'),
        location: getVal('contact-location'),
        phone: getVal('contact-phone'),
        email: getVal('contact-email'),
        github: getVal('contact-github'),
        formAction: getVal('contact-form-action')
      },
      footer: {
        copyright: getVal('footer-copyright'),
        credits: getVal('footer-credits'),
        githubUrl: getVal('footer-github-url'),
        githubLabel: getVal('footer-github-label')
      },
      blog: Array.from(document.querySelectorAll('#blog-list .blog-post-item')).map(el => ({
        id: el.getAttribute('data-id') || generateId(),
        title: el.querySelector('.blog-title-input').value,
        slug: el.querySelector('.blog-slug-input').value,
        date: el.querySelector('.blog-date-input').value,
        category: el.querySelector('.blog-category-input').value,
        excerpt: el.querySelector('.blog-excerpt-input').value,
        status: el.getAttribute('data-status') || 'draft'
      }))
    };
  }

  // ─────────────────────────────────────────────────────────
  // ANALYTICS CHARTS
  // ─────────────────────────────────────────────────────────
  function renderCharts() {
    if (typeof Chart === 'undefined') return;

    const data = cmsData;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#a8a9b4' : '#475569';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    Chart.defaults.color = textColor;

    // Destroy old charts
    Object.values(chartInstances).forEach(c => c.destroy());
    chartInstances = {};

    // 1. Skills doughnut
    const ctxSkills = document.getElementById('chart-skills');
    if (ctxSkills && (data.skills?.bars || []).length > 0) {
      const bars = data.skills.bars.slice(0, 8);
      chartInstances.skills = new Chart(ctxSkills, {
        type: 'doughnut',
        data: {
          labels: bars.map(b => b.name),
          datasets: [{
            data: bars.map(b => b.value),
            backgroundColor: [
              '#0ea5e9','#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6'
            ],
            borderWidth: 2,
            borderColor: isDark ? '#071120' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } } },
          cutout: '65%'
        }
      });
    }

    // 2. Projects by filter bar chart
    const ctxProjects = document.getElementById('chart-projects');
    if (ctxProjects) {
      const filters = data.portfolioFilters || [];
      const portfolio = data.portfolio || [];
      const labels = filters.map(f => f.label).filter(l => l !== 'All');
      const counts = filters.filter(f => f.label !== 'All').map(f =>
        portfolio.filter(p => (p.filters || []).includes(f.filter)).length
      );

      chartInstances.projects = new Chart(ctxProjects, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['No filters'],
          datasets: [{
            label: 'Projects',
            data: counts.length ? counts : [0],
            backgroundColor: 'rgba(14,165,233,0.7)',
            borderColor: '#0ea5e9',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1, beginAtZero: true } }
          }
        }
      });
    }

    // 3. Blog status doughnut
    const ctxBlog = document.getElementById('chart-blog');
    if (ctxBlog) {
      const blog = data.blog || [];
      const published = blog.filter(b => b.status === 'published').length;
      const draft = blog.filter(b => b.status === 'draft').length;
      chartInstances.blog = new Chart(ctxBlog, {
        type: 'doughnut',
        data: {
          labels: ['Published', 'Draft'],
          datasets: [{
            data: [published || 0, draft || 0],
            backgroundColor: ['#10b981', '#f59e0b'],
            borderWidth: 2,
            borderColor: isDark ? '#071120' : '#ffffff'
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
          cutout: '65%'
        }
      });
    }

    // 4. Stat rings
    const statRings = document.getElementById('stat-rings');
    if (statRings) {
      const stats = data.stats || [];
      const ringColors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];
      statRings.innerHTML = stats.map((s, i) => {
        const max = Math.max(...stats.map(x => x.end), 1);
        const pct = Math.round((s.end / max) * 100);
        const circumference = 2 * Math.PI * 36;
        const offset = circumference - (pct / 100) * circumference;
        return `
          <div class="stat-ring-item">
            <div class="stat-ring-wrap">
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle class="stat-ring-track" cx="45" cy="45" r="36"/>
                <circle class="stat-ring-fill" cx="45" cy="45" r="36"
                  stroke="${ringColors[i]}"
                  stroke-dasharray="${circumference}"
                  stroke-dashoffset="${offset}"/>
              </svg>
              <span class="stat-ring-num">${s.end}</span>
            </div>
            <div class="stat-ring-label">${escapeHtml(s.label)}</div>
          </div>
        `;
      }).join('');
    }
  }

  // ─────────────────────────────────────────────────────────
  // MEDIA LIBRARY
  // ─────────────────────────────────────────────────────────
  function renderMediaLibrary() {
    const grid = document.getElementById('media-grid');
    if (!grid) return;

    const items = [];
    const d = cmsData;

    if (d.profile?.image) items.push({ src: d.profile.image, name: 'Profile Photo', section: 'Profile' });
    if (d.hero?.backgroundImage) items.push({ src: d.hero.backgroundImage, name: 'Hero Background', section: 'Hero' });
    if (d.about?.image) items.push({ src: d.about.image, name: 'About Photo', section: 'About' });

    (d.portfolio || []).forEach((p, i) => {
      if (p.image) items.push({ src: p.image, name: p.title || `Project ${i+1}`, section: 'Portfolio' });
    });

    (d.testimonials || []).forEach((t, i) => {
      if (t.image) items.push({ src: t.image, name: t.name || `Testimonial ${i+1}`, section: 'Testimonials' });
    });

    if (items.length === 0) {
      grid.innerHTML = '<div class="ov-empty" style="grid-column:1/-1">No images found. Load your data.json and add images.</div>';
      return;
    }

    grid.innerHTML = items.map((item, i) => `
      <div class="media-item" title="${escapeHtml(item.section)}: ${escapeHtml(item.name)}">
        <div class="media-thumb">
          ${item.src
            ? `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.name)}" loading="lazy">`
            : `<div class="media-thumb-placeholder">🖼</div>`}
        </div>
        <div class="media-info">
          <div class="media-name">${escapeHtml(item.name)}</div>
          <div class="media-section">${escapeHtml(item.section)}</div>
        </div>
      </div>
    `).join('');
  }

  // ─────────────────────────────────────────────────────────
  // BLOG MANAGER
  // ─────────────────────────────────────────────────────────
  function renderBlogList(posts) {
    const list = document.getElementById('blog-list');
    const empty = document.getElementById('blog-empty');
    if (!list) return;
    list.innerHTML = '';

    if (posts.length === 0) {
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    posts.forEach(post => {
      const el = createBlogItem(post);
      list.appendChild(el);
    });
  }

  function createBlogItem(data = {}) {
    const id = data.id || generateId();
    const status = data.status || 'draft';
    const div = document.createElement('div');
    div.className = 'blog-post-item';
    div.setAttribute('data-id', id);
    div.setAttribute('data-status', status);
    div.innerHTML = `
      <div class="blog-post-bar">
        <div class="blog-status-dot ${status}"></div>
        <div class="blog-post-title">${escapeHtml(data.title) || 'Untitled Post'}</div>
        <div class="blog-post-meta">${escapeHtml(data.date) || ''}</div>
        <button class="btn btn-danger btn-sm btn-icon btn-delete-blog" title="Delete">✕</button>
      </div>
      <div class="blog-post-body">
        <div class="row">
          <div class="field">
            <label>Post Title</label>
            <input type="text" class="blog-title-input" value="${escapeHtml(data.title)}">
          </div>
          <div class="field">
            <label>Slug (URL-friendly)</label>
            <input type="text" class="blog-slug-input" value="${escapeHtml(data.slug)}">
          </div>
        </div>
        <div class="row">
          <div class="field">
            <label>Date</label>
            <input type="date" class="blog-date-input" value="${escapeHtml(data.date)}">
          </div>
          <div class="field">
            <label>Category</label>
            <input type="text" class="blog-category-input" value="${escapeHtml(data.category)}" placeholder="Web Development">
          </div>
        </div>
        <div class="field">
          <label>Excerpt / Summary</label>
          <textarea class="blog-excerpt-input" style="min-height:80px">${escapeHtml(data.excerpt)}</textarea>
        </div>
        <div class="field">
          <label>Status</label>
          <div class="blog-status-toggle">
            <button class="blog-status-btn published ${status === 'published' ? 'active' : ''}" data-s="published">✓ Published</button>
            <button class="blog-status-btn draft ${status === 'draft' ? 'active' : ''}" data-s="draft">✎ Draft</button>
          </div>
        </div>
      </div>
    `;

    // Toggle expand/collapse on bar click
    const bar = div.querySelector('.blog-post-bar');
    const body = div.querySelector('.blog-post-body');
    body.style.display = 'none';
    bar.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-blog')) return;
      body.style.display = body.style.display === 'none' ? 'block' : 'none';
    });

    // Delete
    div.querySelector('.btn-delete-blog').addEventListener('click', () => div.remove());

    // Status toggle
    div.querySelectorAll('.blog-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.s;
        div.setAttribute('data-status', s);
        div.querySelector('.blog-status-dot').className = `blog-status-dot ${s}`;
        div.querySelectorAll('.blog-status-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Auto-update title in bar
    const titleInput = div.querySelector('.blog-title-input');
    const titleDisplay = div.querySelector('.blog-post-title');
    titleInput.addEventListener('input', () => {
      titleDisplay.textContent = titleInput.value || 'Untitled Post';
    });

    // Auto-update date in bar
    const dateInput = div.querySelector('.blog-date-input');
    const dateDisplay = div.querySelector('.blog-post-meta');
    dateInput.addEventListener('input', () => {
      dateDisplay.textContent = dateInput.value;
    });

    return div;
  }

  // Add blog post button
  const addBlogBtn = document.getElementById('add-blog-post');
  if (addBlogBtn) {
    addBlogBtn.addEventListener('click', () => {
      const list = document.getElementById('blog-list');
      const empty = document.getElementById('blog-empty');
      if (empty) empty.style.display = 'none';
      const item = createBlogItem({ id: generateId(), status: 'draft', date: new Date().toISOString().split('T')[0] });
      list.appendChild(item);
      // Auto-open the body
      const body = item.querySelector('.blog-post-body');
      if (body) body.style.display = 'block';
    });
  }

  // ─────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────
  function setupNotifications() {
    notifBtn.addEventListener('click', () => {
      notifPanel.classList.add('open');
      notifOverlay.classList.add('show');
      notifBadge.style.display = 'none';
      notifCount = 0;
    });

    const closePanel = () => {
      notifPanel.classList.remove('open');
      notifOverlay.classList.remove('show');
    };

    closeNotif.addEventListener('click', closePanel);
    notifOverlay.addEventListener('click', closePanel);

    clearNotifs.addEventListener('click', () => {
      notifications = [];
      localStorage.removeItem('cms_notifications');
      renderNotifications();
      notifBadge.style.display = 'none';
      notifCount = 0;
    });
  }

  function logActivity(icon, message) {
    const entry = { icon, message, time: new Date().toLocaleString() };
    notifications.unshift(entry);
    if (notifications.length > 50) notifications.pop();
    localStorage.setItem('cms_notifications', JSON.stringify(notifications));

    notifCount++;
    updateNotifBadge();
    renderNotifications();
  }

  function updateNotifBadge() {
    if (notifCount > 0) {
      notifBadge.style.display = 'flex';
      notifBadge.textContent = notifCount > 9 ? '9+' : notifCount;
    } else {
      notifBadge.style.display = 'none';
    }
  }

  function renderNotifications() {
    if (!notifList) return;
    if (notifications.length === 0) {
      notifList.innerHTML = '<div class="notif-empty">No activity yet. Start editing!</div>';
      return;
    }
    notifList.innerHTML = notifications.map(n => `
      <div class="notif-item">
        <div class="notif-icon">${n.icon}</div>
        <div class="notif-body">
          <div class="notif-msg">${escapeHtml(n.message)}</div>
          <div class="notif-time">${n.time}</div>
        </div>
      </div>
    `).join('');
  }

  // ─────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────
  const ALL_SECTIONS = Object.entries(NAV_LABELS).map(([id, label]) => ({
    id, label, icon: NAV_ICONS[id]
  }));

  function setupSearch() {
    searchBtn.addEventListener('click', openSearch);

    document.addEventListener('click', (e) => {
      if (searchOverlay.classList.contains('show') && !e.target.closest('.search-box')) {
        closeSearch();
      }
    });

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) {
        searchResults.innerHTML = '';
        return;
      }
      const matches = ALL_SECTIONS.filter(s => s.label.toLowerCase().includes(q));
      searchResults.innerHTML = matches.map(s => `
        <div class="search-result-item" data-tab="${s.id}">
          <span class="search-result-icon">${s.icon}</span>
          <span>${s.label}</span>
        </div>
      `).join('') || `<div style="padding:14px 20px;color:var(--muted-2);font-size:13px">No results</div>`;

      searchResults.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          navigateTo(item.dataset.tab);
          closeSearch();
        });
      });
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
    });
  }

  function openSearch() {
    searchOverlay.classList.add('show');
    searchInput.value = '';
    searchResults.innerHTML = '';
    setTimeout(() => searchInput.focus(), 50);
  }

  function closeSearch() {
    searchOverlay.classList.remove('show');
  }

  // ─────────────────────────────────────────────────────────
  // THEME TOGGLE
  // ─────────────────────────────────────────────────────────
  function setupThemeToggle() {
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('cms_theme', next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  // ─────────────────────────────────────────────────────────
  // KEYBOARD SHORTCUTS
  // ─────────────────────────────────────────────────────────
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveAndDownload(); }
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') {
        closeSearch();
        notifPanel.classList.remove('open');
        notifOverlay.classList.remove('show');
        if (sidebar && window.innerWidth <= 768) sidebar.classList.remove('open');
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────────────────
  function setupSettings() {
    // Password change
    const savePwdBtn = document.getElementById('settings-save-password');
    if (savePwdBtn) {
      savePwdBtn.addEventListener('click', () => {
        const newPwd = document.getElementById('settings-new-password').value;
        const confirmPwd = document.getElementById('settings-confirm-password').value;
        const msg = document.getElementById('settings-pwd-msg');
        if (!newPwd) return showSettingsMsg(msg, 'Password cannot be empty', 'err');
        if (newPwd.length < 4) return showSettingsMsg(msg, 'Password must be at least 4 characters', 'err');
        if (newPwd !== confirmPwd) return showSettingsMsg(msg, 'Passwords do not match', 'err');
        localStorage.setItem(CMS_CONFIG.PWD_KEY || 'cms_password', newPwd);
        showSettingsMsg(msg, '✓ Password updated successfully', 'ok');
        document.getElementById('settings-new-password').value = '';
        document.getElementById('settings-confirm-password').value = '';
        logActivity('🔐', 'Changed admin password');
      });
    }

    // Accent color swatches
    document.querySelectorAll('.swatch').forEach(swatch => {
      swatch.addEventListener('click', () => {
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        applyAccent(swatch.dataset.color);
      });
    });

    // Custom accent
    const customAccent = document.getElementById('custom-accent');
    if (customAccent) {
      customAccent.addEventListener('input', () => {
        applyAccent(customAccent.value);
        document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
      });
    }

    // Auto-save toggle
    const autoSaveEl = document.getElementById('settings-autosave');
    if (autoSaveEl) {
      autoSaveEl.addEventListener('change', () => {
        autoSaveEnabled = autoSaveEl.checked;
        localStorage.setItem('cms_autosave', autoSaveEnabled);
        showToast(autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled', 'info');
      });
    }

    // Data management
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', saveAndDownload);
    if (btnLoadSettings) btnLoadSettings.addEventListener('click', () => fileLoader.click());
    if (btnClearCache) {
      btnClearCache.addEventListener('click', () => {
        if (confirm('Clear all cached data? You will need to reload data.json.')) {
          localStorage.removeItem(CMS_CONFIG.DATA_KEY);
          showToast('Cache cleared', 'info');
          logActivity('🗑', 'Cleared localStorage cache');
          const msg = document.getElementById('settings-data-msg');
          if (msg) showSettingsMsg(msg, '✓ Cache cleared. Reload your data.json to continue.', 'ok');
        }
      });
    }
  }

  function applyAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    document.documentElement.style.setProperty('--gradient', `linear-gradient(135deg, ${color} 0%, #6366f1 100%)`);
    document.documentElement.style.setProperty('--glow', `rgba(${r},${g},${b},0.35)`);
    document.documentElement.style.setProperty('--glow-2', `rgba(${r},${g},${b},0.15)`);
    localStorage.setItem('cms_accent', color);
  }

  function showSettingsMsg(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = `settings-msg show ${type}`;
    setTimeout(() => el.classList.remove('show'), 4000);
  }

  // ─────────────────────────────────────────────────────────
  // DYNAMIC LISTS
  // ─────────────────────────────────────────────────────────
  function setupDynamicLists() {
    setupListBtn('add-skill-bar', 'skills-bars-list', () => renderSkillBar({ name: '', value: 50 }));
    setupListBtn('add-skill-badge', 'skills-badges-list', () => renderSkillBadge({ icon: '', label: '' }));
    setupListBtn('add-education', 'resume-education-list', () => renderEducation({ degree: '', year: '', institution: '', description: '' }));
    setupListBtn('add-notable-project', 'resume-projects-list', () => renderNotableProject({ title: '', subtitle: '', meta: '', description: '' }));
    setupListBtn('add-experience', 'resume-experience-list', () => renderExperience({ title: '', period: '', location: '', bullets: [] }));
    setupListBtn('add-portfolio-filter', 'portfolio-filters-list', () => renderPortfolioFilter({ label: '', filter: '' }));
    setupListBtn('add-portfolio-item', 'portfolio-items-list', () => renderPortfolioItem({ id: generateId(), title: '', description: '', image: '', url: '', gallery: '', filters: [] }), true);
    setupListBtn('add-service', 'services-list', () => renderService({ id: generateId(), icon: '', title: '', description: '' }));
    setupListBtn('add-testimonial', 'testimonials-list', () => renderTestimonial({ id: generateId(), quote: '', image: '', name: '', role: '' }));
  }

  function setupListBtn(btnId, listId, renderFn, setupDrag = false) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
      const list = document.getElementById(listId);
      const html = renderFn();
      const div = document.createElement('div');
      div.innerHTML = html.trim();
      const item = div.firstChild;
      list.appendChild(item);
      setupItemEvents(item);
      if (setupDrag) setupDragDrop(list);
      if (autoSaveEnabled) autoSave();
    });
  }

  function renderList(listId, items, renderFn, setupDrag = false) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    items.forEach(itemData => {
      const html = renderFn(itemData);
      const div = document.createElement('div');
      div.innerHTML = html.trim();
      const item = div.firstChild;
      list.appendChild(item);
      setupItemEvents(item);
    });
    if (setupDrag) setupDragDrop(list);
  }

  function setupItemEvents(item) {
    const delBtn = item.querySelector('.btn-delete-item');
    if (delBtn) delBtn.addEventListener('click', () => item.remove());

    const range = item.querySelector('input[type="range"]');
    const rangeVal = item.querySelector('.range-val');
    if (range && rangeVal) {
      range.addEventListener('input', (e) => { rangeVal.textContent = e.target.value + '%'; });
    }

    const dzs = item.querySelectorAll('.drop-zone');
    dzs.forEach(dz => initDropZone(dz));

    // Collapse/expand body on bar click
    const bar = item.querySelector('.list-item-bar');
    const body = item.querySelector('.list-item-body');
    if (bar && body) {
      body.style.display = 'none';
      bar.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-item') || e.target.closest('.drag-handle')) return;
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  function setupDragDrop(list) {
    let draggedItem = null;
    list.querySelectorAll('.list-item').forEach(item => {
      item.setAttribute('draggable', true);
      item.addEventListener('dragstart', () => { draggedItem = item; setTimeout(() => { item.style.opacity = '0.5'; }, 0); });
      item.addEventListener('dragend', () => { setTimeout(() => { draggedItem.style.opacity = '1'; draggedItem = null; }, 0); });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const after = getDragAfterElement(list, e.clientY);
        if (after == null) list.appendChild(draggedItem);
        else list.insertBefore(draggedItem, after);
      });
    });
  }

  function getDragAfterElement(container, y) {
    return [...container.querySelectorAll('.list-item:not([style*="opacity: 0.5"])')].reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function autoSave() {
    if (!autoSaveEnabled) return;
    try {
      const data = collectFormData();
      localStorage.setItem(CMS_CONFIG.DATA_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // ─────────────────────────────────────────────────────────
  // LIST RENDERERS
  // ─────────────────────────────────────────────────────────
  function renderSkillBar(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <span class="drag-handle">⠿</span>
          <div class="list-item-label">⚡ ${escapeHtml(data.name) || 'Skill Bar'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field">
              <label>Skill Name</label>
              <input type="text" class="skill-name" value="${escapeHtml(data.name)}">
            </div>
            <div class="field">
              <label>Value (0-100)</label>
              <div class="range-wrap">
                <input type="range" class="skill-value" min="0" max="100" value="${data.value}">
                <span class="range-val">${data.value}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSkillBadge(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <div class="list-item-label">🏷 ${escapeHtml(data.label) || 'Skill Badge'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field">
              <label>Icon Class (e.g. bi-journal)</label>
              <input type="text" class="badge-icon" value="${escapeHtml(data.icon)}">
            </div>
            <div class="field">
              <label>Label</label>
              <input type="text" class="badge-label" value="${escapeHtml(data.label)}">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderEducation(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <div class="list-item-label">🎓 ${escapeHtml(data.degree) || 'Education Entry'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field">
              <label>Degree / Certificate</label>
              <input type="text" class="edu-degree" value="${escapeHtml(data.degree)}">
            </div>
            <div class="field">
              <label>Year</label>
              <input type="text" class="edu-year" value="${escapeHtml(data.year)}">
            </div>
          </div>
          <div class="field"><label>Institution</label><input type="text" class="edu-inst" value="${escapeHtml(data.institution)}"></div>
          <div class="field"><label>Description</label><textarea class="edu-desc">${escapeHtml(data.description)}</textarea></div>
        </div>
      </div>
    `;
  }

  function renderNotableProject(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <div class="list-item-label">💼 ${escapeHtml(data.title) || 'Notable Project'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Title</label><input type="text" class="proj-title" value="${escapeHtml(data.title)}"></div>
            <div class="field"><label>Subtitle</label><input type="text" class="proj-subtitle" value="${escapeHtml(data.subtitle)}"></div>
          </div>
          <div class="field"><label>Meta (Tags / URL)</label><input type="text" class="proj-meta" value="${escapeHtml(data.meta)}"></div>
          <div class="field"><label>Description</label><textarea class="proj-desc">${escapeHtml(data.description)}</textarea></div>
        </div>
      </div>
    `;
  }

  function renderExperience(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <div class="list-item-label">💼 ${escapeHtml(data.title) || 'Experience'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Job Title</label><input type="text" class="exp-title" value="${escapeHtml(data.title)}"></div>
            <div class="field"><label>Period</label><input type="text" class="exp-period" value="${escapeHtml(data.period)}"></div>
          </div>
          <div class="field"><label>Location / Company</label><input type="text" class="exp-location" value="${escapeHtml(data.location)}"></div>
          <div class="field"><label>Bullets (One per line)</label><textarea class="exp-bullets">${escapeHtml((data.bullets || []).join('\n'))}</textarea></div>
        </div>
      </div>
    `;
  }

  function renderPortfolioFilter(data) {
    return `
      <div class="list-item">
        <div class="list-item-bar">
          <div class="list-item-label">🔖 ${escapeHtml(data.label) || 'Filter'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Label (e.g. App)</label><input type="text" class="filter-label" value="${escapeHtml(data.label)}"></div>
            <div class="field"><label>Filter Value (e.g. .filter-app)</label><input type="text" class="filter-val" value="${escapeHtml(data.filter)}"></div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPortfolioItem(data) {
    const id = data.id || generateId();
    const availableFilters = Array.from(document.querySelectorAll('#portfolio-filters-list .filter-val')).map(i => i.value);
    let checksHtml = availableFilters.map(f => {
      const checked = (data.filters || []).includes(f) ? 'checked' : '';
      return `<label class="check-label"><input type="checkbox" class="port-filter-check" value="${escapeHtml(f)}" ${checked}> ${escapeHtml(f)}</label>`;
    }).join('');
    if (!checksHtml) checksHtml = '<span style="color:var(--muted-2);font-size:13px">Add filters above first.</span>';

    return `
      <div class="list-item" data-id="${id}">
        <div class="list-item-bar">
          <span class="drag-handle">⠿</span>
          <div class="list-item-label">🗂 ${escapeHtml(data.title) || 'Portfolio Item'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Title</label><input type="text" class="port-title" value="${escapeHtml(data.title)}"></div>
            <div class="field"><label>URL</label><input type="text" class="port-url" value="${escapeHtml(data.url)}"></div>
          </div>
          <div class="field"><label>Description</label><textarea class="port-desc">${escapeHtml(data.description)}</textarea></div>
          <div class="field"><label>Filters (Check all that apply)</label><div class="check-group">${checksHtml}</div></div>
          <div class="field"><label>Gallery Group</label><input type="text" class="port-gallery" value="${escapeHtml(data.gallery || '')}"></div>
          <div class="field">
            <label>Image</label>
            <div class="drop-zone" id="dz-port-${id}">
              <div class="drop-icon">🖼</div>
              <div class="drop-text">Drop image here or click to upload</div>
              <img class="drop-preview" src="">
              <input type="file" style="display:none" accept="image/*">
              <input type="hidden" class="port-img-val" value="${escapeHtml(data.image)}">
              <button class="drop-clear" title="Remove Image">✕</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderService(data) {
    const id = data.id || generateId();
    return `
      <div class="list-item" data-id="${id}">
        <div class="list-item-bar">
          <div class="list-item-label">🛠 ${escapeHtml(data.title) || 'Service'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Icon (bi-class)</label><input type="text" class="srv-icon" value="${escapeHtml(data.icon)}"></div>
            <div class="field"><label>Title</label><input type="text" class="srv-title" value="${escapeHtml(data.title)}"></div>
          </div>
          <div class="field"><label>Description</label><textarea class="srv-desc">${escapeHtml(data.description)}</textarea></div>
        </div>
      </div>
    `;
  }

  function renderTestimonial(data) {
    const id = data.id || generateId();
    return `
      <div class="list-item" data-id="${id}">
        <div class="list-item-bar">
          <div class="list-item-label">💬 ${escapeHtml(data.name) || 'Testimonial'}</div>
          <button class="btn btn-danger btn-sm btn-icon btn-delete-item" title="Remove">✕</button>
        </div>
        <div class="list-item-body">
          <div class="row">
            <div class="field"><label>Name</label><input type="text" class="test-name" value="${escapeHtml(data.name)}"></div>
            <div class="field"><label>Role / Company</label><input type="text" class="test-role" value="${escapeHtml(data.role)}"></div>
          </div>
          <div class="field"><label>Quote</label><textarea class="test-quote">${escapeHtml(data.quote)}</textarea></div>
          <div class="field">
            <label>Avatar Image</label>
            <div class="drop-zone" id="dz-test-${id}">
              <div class="drop-icon">📷</div>
              <div class="drop-text">Drop image here or click to upload</div>
              <img class="drop-preview" src="">
              <input type="file" style="display:none" accept="image/*">
              <input type="hidden" class="test-img-val" value="${escapeHtml(data.image)}">
              <button class="drop-clear" title="Remove Image">✕</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────
  // DROP ZONES
  // ─────────────────────────────────────────────────────────
  function setupDropZones() {
    document.querySelectorAll('.drop-zone').forEach(dz => initDropZone(dz));
  }

  function initDropZone(dz) {
    const fileInput  = dz.querySelector('input[type="file"]');
    const hiddenInput= dz.querySelector('input[type="hidden"]');
    const preview    = dz.querySelector('.drop-preview');
    const clearBtn   = dz.querySelector('.drop-clear');

    if (hiddenInput && hiddenInput.value) {
      preview.src = hiddenInput.value;
      preview.classList.add('show');
      dz.classList.add('has-image');
    }

    dz.addEventListener('click', (e) => { if (e.target !== clearBtn && !e.target.closest('.drop-clear')) fileInput.click(); });
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', (e) => {
      e.preventDefault(); dz.classList.remove('over');
      if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0], preview, hiddenInput, dz);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files?.[0]) processFile(e.target.files[0], preview, hiddenInput, dz);
    });
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.src = ''; preview.classList.remove('show');
        hiddenInput.value = ''; dz.classList.remove('has-image');
        fileInput.value = '';
      });
    }
  }

  function processFile(file, previewEl, hiddenEl, dz) {
    if (!file.type.startsWith('image/')) { showToast('Please upload an image file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewEl.src = e.target.result;
      previewEl.classList.add('show');
      dz.classList.add('has-image');
      if (hiddenEl) hiddenEl.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function setImageDropzone(idPrefix, val) {
    const hidden  = document.getElementById(`${idPrefix}-value`);
    const preview = document.querySelector(`#${idPrefix}-dropzone .drop-preview`);
    const dz      = document.getElementById(`${idPrefix}-dropzone`);
    if (hidden && preview && dz) {
      hidden.value = val || '';
      if (val) {
        preview.src = val;
        preview.classList.add('show');
        dz.classList.add('has-image');
      } else {
        preview.src = '';
        preview.classList.remove('show');
        dz.classList.remove('has-image');
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────
  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.value = val || '';
      else el.textContent = val || '';
    }
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    if (!str) return '';
    if (typeof str !== 'string') return String(str);
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    const cls = type === 'error' ? 'err' : type === 'info' ? 'info' : 'ok';
    toast.className = `toast show ${cls}`;
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  function updateAvatar(name) {
    const avatar = document.getElementById('topbar-avatar');
    if (!avatar || !name) return;
    const parts = name.trim().split(' ');
    const initials = parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0].substring(0, 2);
    avatar.textContent = initials.toUpperCase();
  }

  function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

});
