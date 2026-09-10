document.addEventListener('DOMContentLoaded', () => {
  // Session Check
  if (localStorage.getItem(CMS_CONFIG.SESSION_KEY) !== 'true') {
    window.location.href = 'index.html';
    return;
  }

  // State
  let cmsData = {};
  
  // Elements
  const tabs = document.querySelectorAll('.cms-tab-content');
  const navItems = document.querySelectorAll('.cms-nav-item');
  const fileLoader = document.getElementById('file-loader');
  const btnLoad = document.getElementById('btn-load');
  const btnSave = document.getElementById('btn-save');
  const toast = document.getElementById('cms-toast');
  const btnLogout = document.getElementById('btn-logout');
  
  // Mobile Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const sidebar = document.querySelector('.cms-sidebar');
  if(mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // Default Template (used if no data loaded)
  const defaultData = {
    meta: { title: "", description: "", keywords: "" },
    profile: { name: "", image: "", availabilityBadge: "", social: { github: "", twitter: "", linkedin: "", whatsapp: "" } },
    hero: { backgroundImage: "", badge: "", heading: "", typedItems: [], ctaPrimary: { label: "", icon: "", href: "" }, ctaOutline: { label: "", icon: "", href: "" } },
    about: { sectionSubtitle: "", heading: "", intro: "", body: "", image: "", info: { location: "", phone: "", city: "", specialisation: "", email: "", freelance: "" } },
    stats: [ { icon: "", end: 0, label: "", sublabel: "" }, { icon: "", end: 0, label: "", sublabel: "" }, { icon: "", end: 0, label: "", sublabel: "" }, { icon: "", end: 0, label: "", sublabel: "" } ],
    skills: { sectionSubtitle: "", bars: [], badges: [] },
    resume: { sectionSubtitle: "", summary: { name: "", description: "", location: "", phone: "", email: "" }, education: [], notableProjects: [], experience: [] },
    portfolio: [],
    portfolioFilters: [],
    services: [],
    testimonials: [],
    contact: { location: "", phone: "", email: "", github: "", formAction: "", sectionSubtitle: "" },
    footer: { copyright: "", credits: "", githubUrl: "", githubLabel: "" }
  };

  // Init
  init();

  function init() {
    // Nav logic
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        tabs.forEach(tab => tab.classList.remove('active'));
        const tabId = item.getAttribute('data-tab');
        const tab = document.querySelector(`.cms-tab-content[data-tab="${tabId}"]`);
        if (tab) tab.classList.add('active');
        
        if (sidebar && window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });

    // File loading
    btnLoad.addEventListener('click', () => fileLoader.click());
    fileLoader.addEventListener('change', handleFileLoad);

    // Save
    btnSave.addEventListener('click', saveAndDownload);
    
    // Logout
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        localStorage.removeItem(CMS_CONFIG.SESSION_KEY);
        window.location.href = 'index.html';
      });
    }

    // Load initial data
    const saved = localStorage.getItem(CMS_CONFIG.DATA_KEY);
    if (saved) {
      try {
        cmsData = JSON.parse(saved);
        populateForm(cmsData);
        showToast('Loaded cached data');
      } catch(e) {
        cmsData = JSON.parse(JSON.stringify(defaultData));
      }
    } else {
      cmsData = JSON.parse(JSON.stringify(defaultData));
    }
    
    setupDropZones();
    setupDynamicLists();
  }

  // File loading
  function handleFileLoad(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        cmsData = Object.assign({}, defaultData, data);
        localStorage.setItem(CMS_CONFIG.DATA_KEY, JSON.stringify(cmsData));
        populateForm(cmsData);
        showToast('Successfully loaded data.json');
      } catch (err) {
        showToast('Invalid JSON file', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  }

  // Populate form
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
  }

  // Save logic
  function saveAndDownload() {
    const data = {
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
        bars: Array.from(document.querySelectorAll('#skills-bars-list .cms-list-item')).map(el => ({
          name: el.querySelector('.skill-name').value,
          value: parseInt(el.querySelector('.skill-value').value) || 0
        })),
        badges: Array.from(document.querySelectorAll('#skills-badges-list .cms-list-item')).map(el => ({
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
        education: Array.from(document.querySelectorAll('#resume-education-list .cms-list-item')).map(el => ({
          degree: el.querySelector('.edu-degree').value,
          year: el.querySelector('.edu-year').value,
          institution: el.querySelector('.edu-inst').value,
          description: el.querySelector('.edu-desc').value
        })),
        notableProjects: Array.from(document.querySelectorAll('#resume-projects-list .cms-list-item')).map(el => ({
          title: el.querySelector('.proj-title').value,
          subtitle: el.querySelector('.proj-subtitle').value,
          meta: el.querySelector('.proj-meta').value,
          description: el.querySelector('.proj-desc').value
        })),
        experience: Array.from(document.querySelectorAll('#resume-experience-list .cms-list-item')).map(el => ({
          title: el.querySelector('.exp-title').value,
          period: el.querySelector('.exp-period').value,
          location: el.querySelector('.exp-location').value,
          bullets: el.querySelector('.exp-bullets').value.split('\n').map(s => s.trim()).filter(Boolean)
        }))
      },
      portfolioFilters: Array.from(document.querySelectorAll('#portfolio-filters-list .cms-list-item')).map(el => ({
        label: el.querySelector('.filter-label').value,
        filter: el.querySelector('.filter-val').value
      })),
      portfolio: Array.from(document.querySelectorAll('#portfolio-items-list .cms-list-item')).map(el => {
        const filters = Array.from(el.querySelectorAll('.port-filter-check:checked')).map(cb => cb.value);
        return {
          id: el.getAttribute('data-id') || generateId(),
          title: el.querySelector('.port-title').value,
          description: el.querySelector('.port-desc').value,
          image: el.querySelector('.port-img-val').value,
          url: el.querySelector('.port-url').value,
          gallery: el.querySelector('.port-gallery').value,
          filters: filters
        };
      }),
      services: Array.from(document.querySelectorAll('#services-list .cms-list-item')).map((el, idx) => ({
        id: el.getAttribute('data-id') || generateId(),
        icon: el.querySelector('.srv-icon').value,
        title: el.querySelector('.srv-title').value,
        description: el.querySelector('.srv-desc').value,
        delay: idx * 100
      })),
      testimonials: Array.from(document.querySelectorAll('#testimonials-list .cms-list-item')).map(el => ({
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
      }
    };

    // Cache locally
    localStorage.setItem(CMS_CONFIG.DATA_KEY, JSON.stringify(data));

    // Download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('data.json downloaded! Upload it to your site folder.');
  }

  // --- Dynamic Lists Logic ---
  
  function setupDynamicLists() {
    setupListBtn('add-skill-bar', 'skills-bars-list', () => renderSkillBar({name:'', value:50}));
    setupListBtn('add-skill-badge', 'skills-badges-list', () => renderSkillBadge({icon:'', label:''}));
    setupListBtn('add-education', 'resume-education-list', () => renderEducation({degree:'', year:'', institution:'', description:''}));
    setupListBtn('add-notable-project', 'resume-projects-list', () => renderNotableProject({title:'', subtitle:'', meta:'', description:''}));
    setupListBtn('add-experience', 'resume-experience-list', () => renderExperience({title:'', period:'', location:'', bullets:[]}));
    setupListBtn('add-portfolio-filter', 'portfolio-filters-list', () => renderPortfolioFilter({label:'', filter:''}));
    setupListBtn('add-portfolio-item', 'portfolio-items-list', () => renderPortfolioItem({id: generateId(), title:'', description:'', image:'', url:'', gallery:'', filters:[]}, true));
    setupListBtn('add-service', 'services-list', () => renderService({id: generateId(), icon:'', title:'', description:''}));
    setupListBtn('add-testimonial', 'testimonials-list', () => renderTestimonial({id: generateId(), quote:'', image:'', name:'', role:''}));
  }

  function setupListBtn(btnId, listId, renderFn) {
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
      
      // Setup drag and drop for portfolio specifically or all draggable items
      if (listId === 'portfolio-items-list') {
        setupDragDrop(list);
      }
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
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        item.remove();
      });
    }

    // Range sliders sync
    const range = item.querySelector('input[type="range"]');
    const rangeVal = item.querySelector('.cms-range-value');
    if (range && rangeVal) {
      range.addEventListener('input', (e) => {
        rangeVal.textContent = e.target.value + '%';
      });
    }

    // Init any dropzones in the new item
    const dzs = item.querySelectorAll('.cms-drop-zone');
    dzs.forEach(dz => initDropZone(dz));
  }

  function setupDragDrop(list) {
    let draggedItem = null;
    
    const items = list.querySelectorAll('.cms-list-item');
    items.forEach(item => {
      item.setAttribute('draggable', true);
      
      item.addEventListener('dragstart', function(e) {
        draggedItem = item;
        setTimeout(() => item.style.opacity = '0.5', 0);
      });
      
      item.addEventListener('dragend', function() {
        setTimeout(() => {
          draggedItem.style.opacity = '1';
          draggedItem = null;
        }, 0);
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(list, e.clientY);
        if (afterElement == null) {
          list.appendChild(draggedItem);
        } else {
          list.insertBefore(draggedItem, afterElement);
        }
      });
    });
  }

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.cms-list-item:not([style*="opacity: 0.5"])')];
    
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // List renderers

  function renderSkillBar(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Skill Bar</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Skill Name</label>
            <input type="text" class="cms-input skill-name" value="${escapeHtml(data.name)}">
          </div>
          <div class="cms-form-group">
            <label>Value (0-100)</label>
            <div class="cms-range-container">
              <input type="range" class="cms-range skill-value" min="0" max="100" value="${data.value}">
              <span class="cms-range-value">${data.value}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderSkillBadge(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Skill Badge</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Icon Class (e.g. bi-journal)</label>
            <input type="text" class="cms-input badge-icon" value="${escapeHtml(data.icon)}">
          </div>
          <div class="cms-form-group">
            <label>Label</label>
            <input type="text" class="cms-input badge-label" value="${escapeHtml(data.label)}">
          </div>
        </div>
      </div>
    `;
  }

  function renderEducation(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Education</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Degree / Certificate</label>
            <input type="text" class="cms-input edu-degree" value="${escapeHtml(data.degree)}">
          </div>
          <div class="cms-form-group">
            <label>Year</label>
            <input type="text" class="cms-input edu-year" value="${escapeHtml(data.year)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Institution</label>
          <input type="text" class="cms-input edu-inst" value="${escapeHtml(data.institution)}">
        </div>
        <div class="cms-form-group">
          <label>Description</label>
          <textarea class="cms-input edu-desc">${escapeHtml(data.description)}</textarea>
        </div>
      </div>
    `;
  }

  function renderNotableProject(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Notable Project</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Title</label>
            <input type="text" class="cms-input proj-title" value="${escapeHtml(data.title)}">
          </div>
          <div class="cms-form-group">
            <label>Subtitle (Year)</label>
            <input type="text" class="cms-input proj-subtitle" value="${escapeHtml(data.subtitle)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Meta (Tags)</label>
          <input type="text" class="cms-input proj-meta" value="${escapeHtml(data.meta)}">
        </div>
        <div class="cms-form-group">
          <label>Description</label>
          <textarea class="cms-input proj-desc">${escapeHtml(data.description)}</textarea>
        </div>
      </div>
    `;
  }

  function renderExperience(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Experience</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Job Title</label>
            <input type="text" class="cms-input exp-title" value="${escapeHtml(data.title)}">
          </div>
          <div class="cms-form-group">
            <label>Period</label>
            <input type="text" class="cms-input exp-period" value="${escapeHtml(data.period)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Location / Company</label>
          <input type="text" class="cms-input exp-location" value="${escapeHtml(data.location)}">
        </div>
        <div class="cms-form-group">
          <label>Bullets (One per line)</label>
          <textarea class="cms-input exp-bullets">${escapeHtml((data.bullets || []).join('\n'))}</textarea>
        </div>
      </div>
    `;
  }

  function renderPortfolioFilter(data) {
    return `
      <div class="cms-list-item">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Filter</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Label (e.g. App)</label>
            <input type="text" class="cms-input filter-label" value="${escapeHtml(data.label)}">
          </div>
          <div class="cms-form-group">
            <label>Filter Value (e.g. filter-app)</label>
            <input type="text" class="cms-input filter-val" value="${escapeHtml(data.filter)}">
          </div>
        </div>
      </div>
    `;
  }

  function renderPortfolioItem(data) {
    const id = data.id || generateId();
    // Reconstruct checkboxes from current filters in UI
    const availableFilters = Array.from(document.querySelectorAll('#portfolio-filters-list .filter-val')).map(i => i.value);
    
    let checksHtml = availableFilters.map(f => {
      const isChecked = (data.filters || []).includes(f) ? 'checked' : '';
      return `<label class="cms-checkbox-label"><input type="checkbox" class="port-filter-check" value="${escapeHtml(f)}" ${isChecked}> ${escapeHtml(f)}</label>`;
    }).join('');

    if(!checksHtml) checksHtml = '<span style="color:#888; font-size:13px;">Add filters in the "Portfolio Filters" section first.</span>';

    return `
      <div class="cms-list-item" data-id="${id}">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title"><span class="cms-drag-handle">☰</span> Portfolio Item</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Title</label>
            <input type="text" class="cms-input port-title" value="${escapeHtml(data.title)}">
          </div>
          <div class="cms-form-group">
            <label>URL (Link to project)</label>
            <input type="text" class="cms-input port-url" value="${escapeHtml(data.url)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Description</label>
          <textarea class="cms-input port-desc">${escapeHtml(data.description)}</textarea>
        </div>
        <div class="cms-form-group">
          <label>Filters (Check all that apply)</label>
          <div class="cms-checkbox-group">${checksHtml}</div>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Gallery (Optional comma separated images)</label>
            <input type="text" class="cms-input port-gallery" value="${escapeHtml(data.gallery || '')}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Image</label>
          <div class="cms-drop-zone" id="dz-port-${id}">
            <div class="cms-drop-zone-icon">📷</div>
            <div class="cms-drop-zone-text">Drop image here or click to upload</div>
            <img class="cms-img-preview" src="">
            <input type="file" style="display:none" accept="image/*">
            <input type="hidden" class="port-img-val" value="${escapeHtml(data.image)}">
            <button class="cms-drop-zone-clear" title="Remove Image">✖</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderService(data) {
    const id = data.id || generateId();
    return `
      <div class="cms-list-item" data-id="${id}">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Service</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Icon (bi-class)</label>
            <input type="text" class="cms-input srv-icon" value="${escapeHtml(data.icon)}">
          </div>
          <div class="cms-form-group">
            <label>Title</label>
            <input type="text" class="cms-input srv-title" value="${escapeHtml(data.title)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Description</label>
          <textarea class="cms-input srv-desc">${escapeHtml(data.description)}</textarea>
        </div>
      </div>
    `;
  }

  function renderTestimonial(data) {
    const id = data.id || generateId();
    return `
      <div class="cms-list-item" data-id="${id}">
        <div class="cms-list-item-header">
          <div class="cms-list-item-title">☰ Testimonial</div>
          <button class="cms-btn-icon danger btn-delete-item" title="Remove">✖</button>
        </div>
        <div class="cms-form-row">
          <div class="cms-form-group">
            <label>Name</label>
            <input type="text" class="cms-input test-name" value="${escapeHtml(data.name)}">
          </div>
          <div class="cms-form-group">
            <label>Role / Company</label>
            <input type="text" class="cms-input test-role" value="${escapeHtml(data.role)}">
          </div>
        </div>
        <div class="cms-form-group">
          <label>Quote</label>
          <textarea class="cms-input test-quote">${escapeHtml(data.quote)}</textarea>
        </div>
        <div class="cms-form-group">
          <label>Image</label>
          <div class="cms-drop-zone" id="dz-test-${id}">
            <div class="cms-drop-zone-icon">📷</div>
            <div class="cms-drop-zone-text">Drop image here or click to upload</div>
            <img class="cms-img-preview" src="">
            <input type="file" style="display:none" accept="image/*">
            <input type="hidden" class="test-img-val" value="${escapeHtml(data.image)}">
            <button class="cms-drop-zone-clear" title="Remove Image">✖</button>
          </div>
        </div>
      </div>
    `;
  }


  // --- Helper Functions ---

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

  function generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(str) {
    if (!str) return '';
    if(typeof str !== 'string') return str;
    return str.replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `cms-toast ${type === 'error' ? 'error' : ''} show`;
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // --- Dropzone Logic ---

  function setupDropZones() {
    document.querySelectorAll('.cms-drop-zone').forEach(dz => initDropZone(dz));
  }

  function initDropZone(dz) {
    const fileInput = dz.querySelector('input[type="file"]');
    const hiddenInput = dz.querySelector('input[type="hidden"]');
    const preview = dz.querySelector('.cms-img-preview');
    const clearBtn = dz.querySelector('.cms-drop-zone-clear');
    
    // Set initial image if exists
    if (hiddenInput && hiddenInput.value) {
      preview.src = hiddenInput.value;
      preview.classList.add('has-image');
      dz.classList.add('has-image');
    }

    dz.addEventListener('click', (e) => {
      if (e.target !== clearBtn) fileInput.click();
    });

    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('dragover');
    });

    dz.addEventListener('dragleave', () => {
      dz.classList.remove('dragover');
    });

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0], preview, hiddenInput, dz);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0], preview, hiddenInput, dz);
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.src = '';
        preview.classList.remove('has-image');
        hiddenInput.value = '';
        dz.classList.remove('has-image');
        fileInput.value = '';
      });
    }
  }

  function processFile(file, previewEl, hiddenEl, dz) {
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target.result;
      previewEl.src = b64;
      previewEl.classList.add('has-image');
      dz.classList.add('has-image');
      if (hiddenEl) hiddenEl.value = b64;
    };
    reader.readAsDataURL(file);
  }

  function setImageDropzone(idPrefix, val) {
    const hidden = document.getElementById(`${idPrefix}-value`);
    const preview = document.querySelector(`#${idPrefix}-dropzone .cms-img-preview`);
    const dz = document.getElementById(`${idPrefix}-dropzone`);
    if (hidden && preview && dz) {
      hidden.value = val || '';
      if (val) {
        preview.src = val;
        preview.classList.add('has-image');
        dz.classList.add('has-image');
      } else {
        preview.src = '';
        preview.classList.remove('has-image');
        dz.classList.remove('has-image');
      }
    }
  }

});
