(function () {
  const connectBtn = document.getElementById("connectBtn");
  const connectMsg = document.getElementById("connectMsg");
  const editorArea = document.getElementById("editorArea");
  const courseRows = document.getElementById("courseRows");
  const saveBtn = document.getElementById("saveBtn");

  let siteData = null; // full parsed courses.json
  let fileSha = null; // needed to update the file via the GitHub API
  let ghConfig = null; // { owner, repo, branch, token }

  const FIELDS = ["name", "category", "duration", "mode", "eligibility", "fee", "originalFee", "tagline"];

  // Restore any connection details from this tab's session (never persisted to disk)
  ["ghOwner", "ghRepo", "ghBranch"].forEach((id) => {
    const saved = sessionStorage.getItem(id);
    if (saved) document.getElementById(id).value = saved;
  });

  connectBtn.addEventListener("click", async () => {
    const owner = document.getElementById("ghOwner").value.trim();
    const repo = document.getElementById("ghRepo").value.trim();
    const branch = document.getElementById("ghBranch").value.trim() || "main";
    const token = document.getElementById("ghToken").value.trim();

    if (!owner || !repo || !token) {
      showMsg(connectMsg, "error", "Please fill in owner, repository and token.");
      return;
    }
    sessionStorage.setItem("ghOwner", owner);
    sessionStorage.setItem("ghRepo", repo);
    sessionStorage.setItem("ghBranch", branch);
    ghConfig = { owner, repo, branch, token };

    connectBtn.disabled = true;
    connectBtn.textContent = "Loading…";
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/data/courses.json?ref=${branch}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } }
      );
      if (!res.ok) throw new Error(`GitHub API responded ${res.status}. Check owner/repo/branch/token permissions.`);
      const json = await res.json();
      fileSha = json.sha;
      const decoded = decodeURIComponent(escape(atob(json.content)));
      siteData = JSON.parse(decoded);
      renderRows();
      editorArea.style.display = "block";
      showMsg(connectMsg, "success", "Loaded courses.json from GitHub. Edit below, then save.");
    } catch (err) {
      console.error(err);
      showMsg(connectMsg, "error", err.message || "Could not load courses.json.");
    } finally {
      connectBtn.disabled = false;
      connectBtn.textContent = "Load courses";
    }
  });

  function renderRows() {
    courseRows.innerHTML = "";
    siteData.courses.forEach((course, idx) => {
      const row = document.createElement("div");
      row.className = "course-row";
      row.dataset.index = idx;
      row.innerHTML = `
        <div class="course-row-top">
          <strong>${course.name}</strong>
          <label class="toggle" title="Admissions open/closed">
            <input type="checkbox" data-field="open" ${course.open !== false ? "checked" : ""} />
            <span></span>
          </label>
        </div>
        <div class="row2" style="margin-top:12px;">
          <div class="field"><label>Name</label><input data-field="name" value="${escapeAttr(course.name)}" /></div>
          <div class="field"><label>Category</label><input data-field="category" value="${escapeAttr(course.category)}" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>Duration</label><input data-field="duration" value="${escapeAttr(course.duration)}" /></div>
          <div class="field"><label>Mode</label><input data-field="mode" value="${escapeAttr(course.mode)}" /></div>
        </div>
        <div class="row2">
          <div class="field"><label>Fee (₹)</label><input data-field="fee" type="number" value="${course.fee ?? ""}" /></div>
          <div class="field"><label>Original fee (₹)</label><input data-field="originalFee" type="number" value="${course.originalFee ?? ""}" /></div>
        </div>
        <div class="field"><label>Tagline</label><input data-field="tagline" value="${escapeAttr(course.tagline || "")}" /></div>
        <div class="field"><label>Overview</label><textarea data-field="overview">${escapeHtml(course.overview || "")}</textarea></div>
        <div class="field"><label>What you'll learn (one per line)</label><textarea class="mono" data-field="concepts" rows="4">${escapeHtml((course.concepts || []).join("\n"))}</textarea></div>
        <div class="field"><label>Practical work (one per line)</label><textarea class="mono" data-field="practical" rows="3">${escapeHtml((course.practical || []).join("\n"))}</textarea></div>
        <button class="btn btn-outline" style="color:var(--closed-500); border-color:var(--closed-500); margin-top:8px;" data-remove="${idx}">Remove this course</button>
      `;
      courseRows.appendChild(row);
    });

    courseRows.querySelectorAll("[data-remove]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.remove);
        if (confirm(`Remove "${siteData.courses[i].name}" from the site? This only applies once you save.`)) {
          siteData.courses.splice(i, 1);
          renderRows();
        }
      });
    });
  }

  function collectRowsIntoSiteData() {
    courseRows.querySelectorAll(".course-row").forEach((row) => {
      const idx = Number(row.dataset.index);
      const course = siteData.courses[idx];
      row.querySelectorAll("[data-field]").forEach((input) => {
        const field = input.dataset.field;
        if (field === "open") course.open = input.checked;
        else if (field === "fee" || field === "originalFee") course[field] = input.value ? Number(input.value) : undefined;
        else if (field === "concepts" || field === "practical") course[field] = input.value.split("\n").map((s) => s.trim()).filter(Boolean);
        else course[field] = input.value;
      });
    });
  }

  document.getElementById("addCourseBtn").addEventListener("click", () => {
    const name = document.getElementById("newName").value.trim();
    if (!name) {
      alert("Please give the course a name first.");
      return;
    }
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const readLines = (elId) =>
      document.getElementById(elId).value.split("\n").map((s) => s.trim()).filter(Boolean);

    siteData.courses.push({
      id,
      name,
      tagline: document.getElementById("newTagline").value.trim(),
      category: document.getElementById("newCategory").value.trim() || "General",
      open: true,
      duration: document.getElementById("newDuration").value.trim(),
      mode: document.getElementById("newMode").value.trim(),
      eligibility: document.getElementById("newEligibility").value.trim(),
      fee: Number(document.getElementById("newFee").value) || 0,
      originalFee: Number(document.getElementById("newOriginalFee").value) || undefined,
      certification: document.getElementById("newCertification").value.trim(),
      overview: document.getElementById("newOverview").value.trim(),
      concepts: readLines("newConcepts"),
      practical: readLines("newPractical"),
      mockInterview: document.getElementById("newMockInterview").value.trim(),
      resumePrep: document.getElementById("newResumePrep").value.trim(),
      highlights: readLines("newHighlights"),
    });
    renderRows();
    document
      .querySelectorAll("#editorArea .admin-card:last-child input, #editorArea .admin-card:last-child textarea")
      .forEach((i) => (i.value = ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  saveBtn.addEventListener("click", async () => {
    collectRowsIntoSiteData();
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    try {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(siteData, null, 2))));
      const res = await fetch(
        `https://api.github.com/repos/${ghConfig.owner}/${ghConfig.repo}/contents/data/courses.json`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ghConfig.token}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify({
            message: "Update courses.json via admin panel",
            content,
            sha: fileSha,
            branch: ghConfig.branch,
          }),
        }
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || `GitHub API responded ${res.status}`);
      }
      const json = await res.json();
      fileSha = json.content.sha;
      alert("Saved. The live site will update within a minute or two once GitHub Pages rebuilds.");
    } catch (err) {
      console.error(err);
      alert("Could not save: " + (err.message || err));
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save changes to GitHub";
    }
  });

  function showMsg(node, type, text) {
    node.className = "form-msg " + type;
    node.textContent = text;
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
})();
