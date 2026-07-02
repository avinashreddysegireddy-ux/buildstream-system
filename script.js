const STAGES = [
  { key: "fetch",   label: "Fetch",   lines: [
      ["info","Cloning repository..."],
      ["dim","remote: Enumerating objects: 214, done."],
      ["ok","Checked out branch main @ a91f3c2"]
    ]},
  { key: "install",  label: "Install", lines: [
      ["info","Installing dependencies..."],
      ["dim","added 312 packages in 4.2s"],
      ["ok","Dependencies resolved"]
    ]},
  { key: "build",    label: "Build",   lines: [
      ["info","Compiling source..."],
      ["dim","bundling assets → dist/"],
      ["ok","Build completed (1.8s)"]
    ]},
  { key: "test",     label: "Test",    lines: [
      ["info","Running test suite..."],
      ["dim","42 passed, 0 failed"],
      ["ok","All tests green"]
    ]},
  { key: "package",  label: "Package", lines: [
      ["info","Packaging artifact..."],
      ["dim","writing build-214.tar.gz"],
      ["ok","Artifact packaged"]
    ]},
  { key: "deploy",   label: "Deploy",  lines: [
      ["info","Deploying to staging..."],
      ["dim","health check: 200 OK"],
      ["ok","Deploy successful"]
    ]},
];

let buildCounter = 213;
let history = [];
let running = false;

function renderTrack(activeIndex, states){
  const track = document.getElementById("track");
  track.innerHTML = "";
  STAGES.forEach((s, i) => {
    const el = document.createElement("div");
    const state = states ? states[i] : "pending";
    el.className = "stage " + state;
    el.innerHTML = `
      <div class="connector"></div>
      <div class="dot"></div>
      <div class="label">${s.label}</div>
    `;
    track.appendChild(el);
  });
}

function logLine(type, text){
  const c = document.getElementById("console");
  const div = document.createElement("div");
  div.className = "line " + type;
  div.textContent = text;
  c.appendChild(div);
  c.scrollTop = c.scrollHeight;
}

function clearConsole(){
  document.getElementById("console").innerHTML = "";
}

function setBadge(state){
  const b = document.getElementById("statusBadge");
  b.className = "badge " + state;
  b.textContent = state === "running" ? "Running" : state === "success" ? "Success" : state === "failed" ? "Failed" : "Idle";
}

function renderHistory(){
  const h = document.getElementById("history");
  if(history.length === 0){
    h.innerHTML = '<div class="empty">No builds yet.</div>';
    return;
  }
  h.innerHTML = history.slice().reverse().map(b => `
    <div class="history-item">
      <span><span class="dot-sm ${b.status}"></span>#${b.id}</span>
      <span class="hid">${b.status === "success" ? "passed" : b.status === "failed" ? "failed" : "running"} · ${b.duration}</span>
    </div>
  `).join("");
}

async function startBuild(){
  if(running) return;
  running = true;
  document.getElementById("triggerBtn").disabled = true;

  buildCounter++;
  const buildId = buildCounter;
  const states = STAGES.map(() => "pending");
  const startedAt = Date.now();

  // ~12% chance a stage fails, for realism
  const failIndex = Math.random() < 0.12 ? Math.floor(Math.random() * STAGES.length) : -1;

  clearConsole();
  setBadge("running");
  logLine("info", `Build #${buildId} started`);
  renderTrack(0, states);

  for(let i = 0; i < STAGES.length; i++){
    states[i] = "running";
    renderTrack(i, states);

    for(const [type, text] of STAGES[i].lines){
      await wait(280 + Math.random()*260);
      logLine(type, text);
    }

    if(i === failIndex){
      await wait(200);
      logLine("err", `Stage "${STAGES[i].label}" failed — exit code 1`);
      states[i] = "failed";
      renderTrack(i, states);
      setBadge("failed");
      finishBuild(buildId, "failed", startedAt);
      return;
    }

    states[i] = "done";
    renderTrack(i, states);
    await wait(150);
  }

  logLine("ok", `Build #${buildId} finished successfully`);
  setBadge("success");
  finishBuild(buildId, "success", startedAt);
}

function finishBuild(id, status, startedAt){
  const duration = ((Date.now() - startedAt) / 1000).toFixed(1) + "s";
  history.push({ id, status, duration });
  renderHistory();
  running = false;
  document.getElementById("triggerBtn").disabled = false;
}

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

// initial paint
renderTrack(-1, STAGES.map(() => "pending"));
renderHistory();
