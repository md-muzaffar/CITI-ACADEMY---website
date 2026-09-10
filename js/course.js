(async function () {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  document.getElementById("year") && (document.getElementById("year").textContent = new Date().getFullYear());

  const courseId = qs("course");
  let data;
  try {
    data = await loadSiteData();
  } catch (err) {
    document.getElementById("courseName").textContent = "Could not load course data";
    console.error(err);
    return;
  }

  const course = data.courses.find((c) => c.id === courseId);
  if (!course) {
    document.getElementById("courseName").textContent = "Course not found";
    document.getElementById("courseOverview").textContent =
      "We couldn't find that course. It may have been renamed or removed. Please go back to the course list.";
    return;
  }

  const isOpen = course.open !== false;

  document.title = `${course.name} — CITI Academy`;
  document.getElementById("pageDescription").setAttribute(
    "content",
    `${course.name} at CITI Academy: ${course.tagline || ""} Duration ${course.duration}, ${course.mode}. ${isOpen ? "Admissions open." : ""}`
  );

  document.getElementById("crumbName").textContent = course.name;
  document.getElementById("courseCategory").textContent = course.category;
  document.getElementById("courseName").textContent = course.name;
  document.getElementById("courseTagline").textContent = course.tagline || "";
  document.getElementById("courseOverview").textContent = course.overview || "";
  document.getElementById("mockInterviewText").textContent = course.mockInterview || "";
  document.getElementById("resumePrepText").textContent = course.resumePrep || "";
  document.getElementById("certificationText").textContent = course.certification || "";

  const statusEl = document.getElementById("courseStatus");
  statusEl.textContent = isOpen ? "Admissions open" : "Admissions closed";
  statusEl.style.background = isOpen ? "rgba(31,157,85,.16)" : "rgba(192,57,43,.18)";
  statusEl.style.color = isOpen ? "#3ee08a" : "#ff8a7a";

  function fillList(elementId, items) {
    const ul = document.getElementById(elementId);
    ul.innerHTML = "";
    (items || []).forEach((item) => {
      ul.appendChild(el("li", { html: iconMarkup("check") + `<span>${item}</span>` }));
    });
  }
  fillList("conceptsList", course.concepts);
  fillList("practicalList", course.practical);
  fillList("highlightsList", course.highlights);

  document.getElementById("sideFee").textContent = formatINR(course.fee);
  if (course.originalFee) document.getElementById("sideOriginalFee").textContent = formatINR(course.originalFee);
  document.getElementById("sideDuration").textContent = course.duration;
  document.getElementById("sideMode").textContent = course.mode;
  document.getElementById("sideEligibility").textContent = course.eligibility;
  document.getElementById("sideCategory").textContent = course.category;

  // Registration area
  const regArea = document.getElementById("registrationArea");
  if (!isOpen) {
    const wa = `https://wa.me/91${data.institute.phones[0]}?text=${encodeURIComponent(
      `Hi, admissions for ${course.name} look closed on the website — please let me know when the next batch opens.`
    )}`;
    regArea.innerHTML = `
      <div class="closed-note">
        ${iconMarkup("lock")}
        <p style="margin:6px 0 12px;">Admissions for this course are currently closed.</p>
        <a class="btn btn-navy btn-block" href="${wa}" target="_blank" rel="noopener">Ask about the next batch</a>
      </div>
    `;
    return;
  }

  regArea.innerHTML = `
    <h2 style="font-size:1.05rem;">Register for this course</h2>
    <form class="reg-form" id="regForm">
      <div class="field">
        <label for="regName">Full name</label>
        <input id="regName" name="name" type="text" required autocomplete="name" />
      </div>
      <div class="row2">
        <div class="field">
          <label for="regPhone">Phone number</label>
          <input id="regPhone" name="phone" type="tel" pattern="[0-9]{10}" placeholder="10-digit number" required autocomplete="tel" />
        </div>
        <div class="field">
          <label for="regEmail">Email (optional)</label>
          <input id="regEmail" name="email" type="email" autocomplete="email" />
        </div>
      </div>
      <div class="field">
        <label for="regQualification">Highest qualification</label>
        <input id="regQualification" name="qualification" type="text" placeholder="e.g. 12th, B.Sc, B.Ed" required />
      </div>
      <div class="field">
        <label for="regMode">Preferred mode</label>
        <select id="regMode" name="preferredMode">
          <option>Offline</option>
          <option>Online</option>
          <option>No preference</option>
        </select>
      </div>
      <div class="field">
        <label for="regMessage">Message (optional)</label>
        <textarea id="regMessage" name="message" placeholder="Anything you'd like us to know"></textarea>
      </div>
      <button class="btn btn-primary btn-block" type="submit" id="regSubmitBtn">Submit registration</button>
      <div class="form-msg" id="regMsg"></div>
    </form>
  `;

  document.getElementById("regForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = document.getElementById("regSubmitBtn");
    const msg = document.getElementById("regMsg");
    msg.className = "form-msg";
    msg.textContent = "";

    if (!REGISTRATION_ENDPOINT || REGISTRATION_ENDPOINT.includes("PASTE_YOUR")) {
      msg.className = "form-msg error";
      msg.textContent =
        "Registrations aren't connected to Google Sheets yet. See README.md → 'Connect registrations to Google Sheets' to finish setup.";
      return;
    }

    const payload = {
      courseId: course.id,
      courseName: course.name,
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      qualification: form.qualification.value.trim(),
      preferredMode: form.preferredMode.value,
      message: form.message.value.trim(),
      submittedAt: new Date().toISOString(),
      source: window.location.href,
    };

    btn.disabled = true;
    btn.textContent = "Submitting…";
    try {
      // Apps Script web apps don't send permissive CORS headers back for
      // normal fetch reads, so we send as text/plain (a "simple request")
      // and treat the call as fire-and-forget from the browser's point of view.
      await fetch(REGISTRATION_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      msg.className = "form-msg success";
      msg.textContent = "Thanks! Your registration has been received. We'll contact you shortly.";
      form.reset();
    } catch (err) {
      console.error(err);
      msg.className = "form-msg error";
      msg.textContent = "Something went wrong sending your registration. Please call us instead.";
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit registration";
    }
  });
})();
