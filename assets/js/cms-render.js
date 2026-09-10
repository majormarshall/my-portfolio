async function fetchAndRenderData() {
  try {
    const response = await fetch('data.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();

    // 1. Meta Tags
    document.title = data.meta.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = data.meta.description;
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.content = data.meta.keywords;

    // 2. Header
    const profileImg = document.getElementById('cms-profile-img');
    if (profileImg) profileImg.src = data.profile.image;
    
    const siteName = document.getElementById('cms-site-name');
    if (siteName) siteName.textContent = data.profile.name;
    
    const availText = document.getElementById('cms-availability-text');
    if (availText) availText.textContent = data.profile.availabilityBadge;
    
    const socialLinks = document.getElementById('cms-social-links');
    if (socialLinks) {
      let socialHtml = '';
      if (data.profile.social.github) socialHtml += `<a href="${data.profile.social.github}" target="_blank" class="github"><i class="bi bi-github"></i></a>`;
      if (data.profile.social.twitter) socialHtml += `<a href="${data.profile.social.twitter}" target="_blank" class="twitter"><i class="bi bi-twitter-x"></i></a>`;
      if (data.profile.social.linkedin) socialHtml += `<a href="${data.profile.social.linkedin}" target="_blank" class="linkedin"><i class="bi bi-linkedin"></i></a>`;
      if (data.profile.social.whatsapp) socialHtml += `<a href="${data.profile.social.whatsapp}" target="_blank" class="whatsapp"><i class="bi bi-whatsapp"></i></a>`;
      socialLinks.innerHTML = socialHtml;
    }

    // 3. Hero
    const heroBg = document.getElementById('cms-hero-bg');
    if (heroBg) heroBg.src = data.hero.backgroundImage;
    
    const heroBadgeText = document.getElementById('cms-hero-badge-text');
    if (heroBadgeText) heroBadgeText.textContent = data.hero.badge;
    
    const heroHeading = document.getElementById('cms-hero-heading');
    if (heroHeading) heroHeading.textContent = data.hero.heading;
    
    const typed = document.getElementById('cms-typed');
    if (typed) {
      typed.textContent = data.hero.typedItems[0] || '';
      typed.setAttribute('data-typed-items', data.hero.typedItems.join(','));
    }
    
    const heroBtns = document.getElementById('cms-hero-btns');
    if (heroBtns) {
      heroBtns.innerHTML = `
        <a href="${data.hero.ctaPrimary.href}" class="btn-hero-primary"><i class="bi ${data.hero.ctaPrimary.icon}"></i> ${data.hero.ctaPrimary.label}</a>
        <a href="${data.hero.ctaOutline.href}" class="btn-hero-outline"><i class="bi ${data.hero.ctaOutline.icon}"></i> ${data.hero.ctaOutline.label}</a>
      `;
    }

    // 4. About
    const aboutSubtitle = document.getElementById('cms-about-subtitle');
    if (aboutSubtitle) aboutSubtitle.textContent = data.about.sectionSubtitle;
    
    const aboutHeading = document.getElementById('cms-about-heading');
    if (aboutHeading) aboutHeading.textContent = data.about.heading;
    
    const aboutImg = document.getElementById('cms-about-img');
    if (aboutImg) aboutImg.src = data.about.image;
    
    const aboutIntro = document.getElementById('cms-about-intro');
    if (aboutIntro) aboutIntro.textContent = data.about.intro;
    
    const aboutInfoLeft = document.getElementById('cms-about-info-left');
    if (aboutInfoLeft) {
      aboutInfoLeft.innerHTML = `
        <li><i class="bi bi-chevron-right"></i> <strong>Location:</strong> <span>${data.about.info.location}</span></li>
        <li><i class="bi bi-chevron-right"></i> <strong>Phone:</strong> <span>${data.about.info.phone}</span></li>
        <li><i class="bi bi-chevron-right"></i> <strong>City:</strong> <span>${data.about.info.city}</span></li>
      `;
    }
    
    const aboutInfoRight = document.getElementById('cms-about-info-right');
    if (aboutInfoRight) {
      aboutInfoRight.innerHTML = `
        <li><i class="bi bi-chevron-right"></i> <strong>Specialisation:</strong> <span>${data.about.info.specialisation}</span></li>
        <li><i class="bi bi-chevron-right"></i> <strong>Email:</strong> <span>${data.about.info.email}</span></li>
        <li><i class="bi bi-chevron-right"></i> <strong>Freelance:</strong> <span>${data.about.info.freelance}</span></li>
      `;
    }
    
    const aboutBody = document.getElementById('cms-about-body');
    if (aboutBody) aboutBody.textContent = data.about.body;

    // 5. Stats
    const statsRow = document.getElementById('cms-stats-row');
    if (statsRow) {
      statsRow.innerHTML = data.stats.map(stat => `
        <div class="col-lg-3 col-md-6">
          <div class="stats-item">
            <i class="bi ${stat.icon}"></i>
            <span data-purecounter-start="0" data-purecounter-end="${stat.end}" data-purecounter-duration="1" class="purecounter"></span>
            <p><strong>${stat.label}</strong> <span>${stat.sublabel}</span></p>
          </div>
        </div>
      `).join('');
    }

    // 6. Skills
    const skillsSubtitle = document.getElementById('cms-skills-subtitle');
    if (skillsSubtitle) skillsSubtitle.textContent = data.skills.sectionSubtitle;
    
    const skillsLeft = document.getElementById('cms-skills-left');
    const skillsRight = document.getElementById('cms-skills-right');
    if (skillsLeft && skillsRight) {
      let leftHtml = '';
      let rightHtml = '';
      data.skills.bars.forEach((bar, index) => {
        const html = `
          <div class="progress">
            <span class="skill"><span>${bar.name}</span> <i class="val">${bar.value}%</i></span>
            <div class="progress-bar-wrap">
              <div class="progress-bar" role="progressbar" aria-valuenow="${bar.value}" aria-valuemin="0" aria-valuemax="100" style="width: ${bar.value}%"></div>
            </div>
          </div>
        `;
        if (index < 5) {
          leftHtml += html;
        } else {
          rightHtml += html;
        }
      });
      skillsLeft.innerHTML = leftHtml;
      skillsRight.innerHTML = rightHtml;
    }
    
    const techBadges = document.getElementById('cms-tech-badges');
    if (techBadges) {
      techBadges.innerHTML = data.skills.badges.map(badge => `
        <span class="tech-badge"><i class="bi ${badge.icon}"></i> ${badge.label}</span>
      `).join('');
    }

    // 7. Resume
    const resumeSubtitle = document.getElementById('cms-resume-subtitle');
    if (resumeSubtitle) resumeSubtitle.textContent = data.resume.sectionSubtitle;
    
    const resumeLeft = document.getElementById('cms-resume-left');
    if (resumeLeft) {
      let html = `<h3 class="resume-title">Summary</h3>
        <div class="resume-item pb-0">
          <h4>${data.resume.summary.name}</h4>
          <p><em>${data.resume.summary.description}</em></p>
          <ul>
            <li>${data.resume.summary.location}</li>
            <li>${data.resume.summary.phone}</li>
            <li>${data.resume.summary.email}</li>
          </ul>
        </div>`;
      
      html += `<h3 class="resume-title">Education</h3>`;
      html += data.resume.education.map(edu => `
        <div class="resume-item">
          <h4>${edu.degree}</h4>
          <h5>${edu.year}</h5>
          <p><em>${edu.institution}</em></p>
          <p>${edu.description}</p>
        </div>
      `).join('');
      
      html += `<h3 class="resume-title">Notable Projects</h3>`;
      html += data.resume.notableProjects.map(proj => `
        <div class="resume-item">
          <h4>${proj.title}</h4>
          <h5>${proj.subtitle}</h5>
          <p><em>${proj.meta}</em></p>
          <p>${proj.description}</p>
        </div>
      `).join('');
      
      resumeLeft.innerHTML = html;
    }
    
    const resumeRight = document.getElementById('cms-resume-right');
    if (resumeRight) {
      let html = `<h3 class="resume-title">Professional Experience</h3>`;
      html += data.resume.experience.map(exp => `
        <div class="resume-item">
          <h4>${exp.title}</h4>
          <h5>${exp.period}</h5>
          <p><em>${exp.location}</em></p>
          <ul>
            ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
          </ul>
        </div>
      `).join('');
      resumeRight.innerHTML = html;
    }

    // 8. Portfolio
    const portfolioFilters = document.getElementById('cms-portfolio-filters');
    if (portfolioFilters) {
      portfolioFilters.innerHTML = data.portfolioFilters.map((filter, index) => `
        <li data-filter="${filter.filter}" class="${index === 0 ? 'filter-active' : ''}">${filter.label}</li>
      `).join('');
    }
    
    const portfolioItems = document.getElementById('cms-portfolio-items');
    if (portfolioItems) {
      portfolioItems.innerHTML = data.portfolio.map(item => `
        <div class="col-lg-4 col-md-6 portfolio-item isotope-item ${item.filters.join(' ')}">
          <div class="portfolio-content h-100">
            <img src="${item.image}" class="img-fluid" alt="${item.title}">
            <div class="portfolio-info">
              <h4>${item.title}</h4>
              <p>${item.description}</p>
              <a href="${item.image}" title="${item.title}" data-gallery="${item.gallery}" class="glightbox preview-link"><i class="bi bi-zoom-in"></i></a>
              <a href="${item.url}" target="_blank" title="Visit Live Site" class="details-link"><i class="bi bi-link-45deg"></i></a>
            </div>
          </div>
        </div>
      `).join('');
    }

    // 9. Services
    const servicesRow = document.getElementById('cms-services-row');
    if (servicesRow) {
      servicesRow.innerHTML = data.services.map(service => `
        <div class="col-lg-4 col-md-6 service-item d-flex" data-aos="fade-up" data-aos-delay="${service.delay}">
          <div class="icon flex-shrink-0"><i class="bi ${service.icon}"></i></div>
          <div>
            <h4 class="title"><a href="#contact" class="stretched-link">${service.title}</a></h4>
            <p class="description">${service.description}</p>
          </div>
        </div>
      `).join('');
    }

    // 10. Testimonials
    const testimonialsWrapper = document.getElementById('cms-testimonials-wrapper');
    if (testimonialsWrapper) {
      testimonialsWrapper.innerHTML = data.testimonials.map(testimonial => `
        <div class="swiper-slide">
          <div class="testimonial-item">
            <p>
              <i class="bi bi-quote quote-icon-left"></i>
              <span>${testimonial.quote}</span>
              <i class="bi bi-quote quote-icon-right"></i>
            </p>
            <img src="${testimonial.image}" class="testimonial-img" alt="">
            <h3>${testimonial.name}</h3>
            <h4>${testimonial.role}</h4>
          </div>
        </div>
      `).join('');
    }

    // 11. Contact
    const contactSubtitle = document.getElementById('cms-contact-subtitle');
    if (contactSubtitle) contactSubtitle.textContent = data.contact.sectionSubtitle;
    
    const contactLocation = document.getElementById('cms-contact-location');
    if (contactLocation) contactLocation.textContent = data.contact.location;
    
    const contactPhone = document.getElementById('cms-contact-phone');
    if (contactPhone) contactPhone.textContent = data.contact.phone;
    
    const contactEmail = document.getElementById('cms-contact-email');
    if (contactEmail) contactEmail.textContent = data.contact.email;
    
    const contactGithubLink = document.getElementById('cms-contact-github-link');
    if (contactGithubLink) {
      contactGithubLink.href = data.contact.github;
      contactGithubLink.textContent = data.contact.github.replace(/^https?:\/\//, '');
    }
    
    const contactForm = document.getElementById('cms-contact-form');
    if (contactForm) contactForm.action = data.contact.formAction;

    // 12. Footer
    const footerName = document.getElementById('cms-footer-name');
    if (footerName) footerName.textContent = data.footer.copyright;
    
    const footerCredits = document.getElementById('cms-footer-credits');
    if (footerCredits) {
      footerCredits.innerHTML = `
        ${data.footer.credits} &nbsp;|&nbsp; Built with ❤️ by <a href="${data.footer.githubUrl}" target="_blank">${data.footer.githubLabel}</a>
      `;
    }

    // Dispatch event so that vendors can reinitialize
    document.dispatchEvent(new CustomEvent('cms:rendered'));

    // Trigger vendor specific initializations if available
    if (window.AOS) window.AOS.refresh();
    if (window.PureCounter) new PureCounter();
    if (window.GLightbox) window.GLightbox({ selector: '.glightbox' });
    if (window.__cms_reinitSwiper) window.__cms_reinitSwiper();
    
    // Typed.js re-init (if needed, usually main.js handles it if typed is initialized after cms:rendered)

  } catch (error) {
    console.error('Error fetching or rendering CMS data:', error);
  }
}

// Call the function on DOMContentLoaded
document.addEventListener('DOMContentLoaded', fetchAndRenderData);
