(async function () {
  // Mobile nav toggle
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      })
    );
  }
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());

  let data;
  try {
    data = await loadSiteData();
  } catch (err) {
    document.getElementById("courseGrid").innerHTML =
      '<p>Course information could not be loaded right now. Please call us directly.</p>';
    console.error(err);
    return;
  }

  const { institute, courses } = data;
  const primaryPhone = institute.phones[0];
  const waLink = `https://wa.me/91${primaryPhone}?text=${encodeURIComponent("Hi, I'd like to know more about courses at CITI Academy.")}`;
  const heroWA = document.getElementById("heroWhatsapp");
  if (heroWA) heroWA.href = waLink;

  // Hero meta row
  const heroMeta = document.getElementById("heroMeta");
  if (heroMeta) {
    heroMeta.append(
      el("div", { class: "hero-meta-item", html: iconMarkup("pin") + `<span>${institute.address}</span>` }),
      el("div", { class: "hero-meta-item", html: iconMarkup("phone") + `<span>${institute.phones.join(" / ")}</span>` })
    );
  }

  // Stat strip
  const statStrip = document.getElementById("statStrip");
  if (statStrip) {
    const stats = [
      { icon: "clock", title: "Flexible durations", sub: "From 6 weeks to 6 months, by course" },
      { icon: "monitor", title: "Offline / Online", sub: "Learn in person or remotely" },
      { icon: "users", title: "10th, 12th, any degree", sub: "Open to most eligibility levels" },
      { icon: "cap", title: "Certificate provided", sub: "On successful completion" },
    ];
    stats.forEach((s) => {
      statStrip.appendChild(
        el("div", { class: "stat-card", html: `${iconMarkup(s.icon)}<strong>${s.title}</strong><span>${s.sub}</span>` })
      );
    });
  }

  // Course grid + filters
  const grid = document.getElementById("courseGrid");
  const filterBar = document.getElementById("courseFilters");
  const categories = ["All", ...new Set(courses.map((c) => c.category))];
  let activeCategory = "All";

  function renderFilters() {
    filterBar.innerHTML = "";
    categories.forEach((cat) => {
      const btn = el("button", { class: "chip-filter" + (cat === activeCategory ? " is-active" : "") }, cat);
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderFilters();
        renderGrid();
      });
      filterBar.appendChild(btn);
    });
  }

  function courseCard(course) {
    const isOpen = course.open !== false;
    const card = el("a", {
      class: "course-card" + (isOpen ? "" : " is-closed"),
      href: `course.html?course=${encodeURIComponent(course.id)}`,
    });
    card.innerHTML = `
      <span class="status ${isOpen ? "open" : "closed"}">${isOpen ? "Admissions open" : "Admissions closed"}</span>
      <span class="category">${course.category}</span>
      <h3>${course.name}</h3>
      <p class="tagline">${course.tagline || ""}</p>
      <div class="fee-row">
        <span class="fee">${formatINR(course.fee)}</span>
        ${course.originalFee ? `<span class="was">${formatINR(course.originalFee)}</span>` : ""}
      </div>
      <div class="meta-row">
        <span><b>Duration:</b> ${course.duration}</span>
        <span><b>Mode:</b> ${course.mode}</span>
      </div>
      <span class="cta-line">${isOpen ? "View details & register" : "View details"} ${iconMarkup("arrow")}</span>
    `;
    return card;
  }

  function renderGrid() {
    grid.innerHTML = "";
    const list = courses.filter((c) => activeCategory === "All" || c.category === activeCategory);
    if (!list.length) {
      grid.innerHTML = '<div class="empty-state">No courses in this category yet.</div>';
      return;
    }
    list.forEach((c) => grid.appendChild(courseCard(c)));
  }

  renderFilters();
  renderGrid();

  // Why grid
  const whyItems = [
    "Practical training in every course",
    "Mock tests and module assessments",
    "Industry-recognised certification",
    "Interview preparation & guidance",
    "Resume building support",
    "Experienced, friendly trainers",
    "Doubt-clearing sessions",
    "Flexible offline / online learning",
    "Ongoing career guidance",
  ];
  const whyGrid = document.getElementById("whyGrid");
  if (whyGrid) {
    whyItems.forEach((text) => {
      whyGrid.appendChild(el("div", { class: "why-item", html: iconMarkup("check") + `<span>${text}</span>` }));
    });
  }

  // Contact card
  const contactCard = document.getElementById("contactCard");
  if (contactCard) {
    contactCard.innerHTML = `
      <div class="contact-line">${iconMarkup("pin")}<div><strong>Address</strong><span>${institute.address}</span></div></div>
      <div class="contact-line">${iconMarkup("phone")}<div><strong>Call / WhatsApp</strong>
        <a href="tel:+91${institute.phones[0]}">${institute.phones[0]}</a><br/>
        <a href="tel:+91${institute.phones[1]}">${institute.phones[1]}</a>
      </div></div>
      <div class="contact-line">${iconMarkup("clock")}<div><strong>Admissions</strong><span>Open now — walk in or call ahead</span></div></div>
      <a class="btn btn-primary" style="margin-top:16px;" href="${waLink}" target="_blank" rel="noopener">Message us on WhatsApp</a>
    `;
  }

  const mapFrame = document.getElementById("mapFrame");
  if (mapFrame) {
    mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(institute.mapQuery)}&output=embed`;
  }

  // Footer
  const footerLinks = document.getElementById("footerCourseLinks");
  if (footerLinks) {
    courses.forEach((c) => {
      footerLinks.appendChild(el("a", { href: `course.html?course=${encodeURIComponent(c.id)}` }, c.name));
    });
  }
  const fAddr = document.getElementById("footerAddress");
  if (fAddr) fAddr.textContent = institute.address;
  const fp1 = document.getElementById("footerPhone1");
  if (fp1) { fp1.textContent = institute.phones[0]; fp1.href = `tel:+91${institute.phones[0]}`; }
  const fp2 = document.getElementById("footerPhone2");
  if (fp2) { fp2.textContent = institute.phones[1]; fp2.href = `tel:+91${institute.phones[1]}`; }
})();
