const API_URL =
  "https://script.google.com/macros/s/AKfycbxcf5h1I3vI8mxpsDxzlY8qO4pZRYVMb9Q7UQXsF3-OLY4FZ7TpXn26V3bTxx7dD7QhAA/exec";
// ==========================
// EMPLOYEES DATABASE
// ==========================

let employees = [];
async function loadEmployees() {
  try {
    const response = await fetch(API_URL);

    employees = await response.json();

    refreshDashboard();

    console.log("Employees loaded", employees);
  } catch (error) {
    console.error(error);
  }
}
// ==========================
// LIVE CLOCK
// ==========================

function updateClock() {
  const now = new Date();

  const formatted = now.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  document.getElementById("clock").textContent = formatted;
}

setInterval(updateClock, 1000);
updateClock();

// ==========================
// DASHBOARD COUNTERS
// ==========================

function animateValue(element, start, end, duration) {
  let startTime = null;

  function animation(currentTime) {
    if (!startTime) startTime = currentTime;

    const progress = Math.min((currentTime - startTime) / duration, 1);

    element.textContent = Math.floor(progress * (end - start) + start);

    if (progress < 1) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

function updateCounters() {
  const total = employees.length;

  const present = employees.filter((emp) => emp.status === "IN").length;

  const absent = total - present;

  animateValue(document.getElementById("totalEmployees"), 0, total, 600);

  animateValue(document.getElementById("presentEmployees"), 0, present, 600);

  animateValue(document.getElementById("absentEmployees"), 0, absent, 600);
}

// ==========================
// TABLE
// ==========================

function renderTable() {
  const table = document.getElementById("employeeTable");

  table.innerHTML = "";

  employees.forEach((emp) => {
    let badgeClass = "";
    let badgeText = "";
    let statusClass = "";

    if (emp.status === "IN") {
      statusClass = "status-in";
    } else if (emp.status === "OUT") {
      statusClass = "status-out";
    } else {
      statusClass = "status-none";
    }

    table.innerHTML += `

<tr>

    <td>${emp.name}</td>

    <td>${emp.id}</td>

    <td>${emp.shift}</td>

    <td>
        <span class="${statusClass}">
            ${emp.status}
        </span>
    </td>

    <td>${emp.lastMovement}</td>

    <td>

        <button
        class="delete-btn"
        onclick="deleteEmployee('${emp.id}')">

            Delete

        </button>

    </td>

</tr>

`;
  });
}

//
// SHIFT COVERAGE
//

function renderShiftCoverage() {
  const container = document.getElementById("shiftCoverage");

  container.innerHTML = "";

  const shifts = ["Morning", "Evening", "Night"];

  shifts.forEach((shift) => {
    const total = employees.filter((emp) => emp.shift === shift).length;

    const present = employees.filter(
      (emp) => emp.shift === shift && emp.status === "IN",
    ).length;

    const absent = total - present;

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    container.innerHTML += `

        <div class="shift-row">

            <div class="shift-header-row">

                <span class="shift-name">
                    Shift ${shift}
                </span>

                <span class="shift-count">
                    ${present} IN / ${total} expected
                </span>

            </div>

            <div class="shift-progress">

                <div
                    class="shift-progress-fill"
                    style="width:${percentage}%">
                </div>

            </div>

            <div class="shift-footer-row">

                <span>
                    Coverage: ${percentage}%
                </span>

                <span>
                    Absent/not IN: ${absent}
                </span>

            </div>

        </div>

        `;
  });
}

// ==========================
// CHECK IN
// ==========================

async function checkIn() {
  const id = document.getElementById("empId").value.trim().toUpperCase();

  const employee = employees.find((emp) => emp.id === id);

  if (!employee) {
    alert("Employee not found");

    return;
  }

  employee.status = "IN";
  employee.lastMovement = new Date().toLocaleString();

  refreshDashboard();

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      employeeId: id,
      action: "IN",
    }),
  });

  showMessage(`IN recorded for ${employee.name}`, "success");
}

// ==========================
// CHECK OUT
// ==========================

async function checkOut() {
  const id = document.getElementById("empId").value.trim().toUpperCase();

  const employee = employees.find((emp) => emp.id === id);

  if (!employee) {
    alert("Employee not found");

    return;
  }

  employee.status = "OUT";
  employee.lastMovement = new Date().toLocaleString();

  refreshDashboard();

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      employeeId: id,
      action: "OUT",
    }),
  });

  showMessage(`OUT recorded for ${employee.name}`, "success");
}

// ==========================
// SEARCH
// ==========================

document.getElementById("search").addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  const rows = document.querySelectorAll("#employeeTable tr");

  rows.forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});

function saveData() {
  localStorage.setItem("employees", JSON.stringify(employees));
}

// ==========================
// REFRESH
// ==========================

function refreshDashboard() {
  updateCounters();

  renderTable();

  renderShiftCoverage();

  renderAttendanceChart();
}

refreshDashboard();
setInterval(() => {
  refreshDashboard();
}, 15000);
const searchInput = document.getElementById("search");

searchInput.addEventListener("keyup", function () {
  const value = this.value.toLowerCase();

  const rows = document.querySelectorAll("#employeeTable tr");

  rows.forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(value)
      ? ""
      : "none";
  });
});
document.getElementById("empId").addEventListener("input", function () {
  const id = this.value.trim().toUpperCase();

  const employee = employees.find((emp) => emp.id === id);

  if (employee) {
    document.getElementById("empName").value = employee.name;

    document.getElementById("shift").value = employee.shift;
  } else {
    document.getElementById("empName").value = "";
  }
});
function showMessage(text, type) {
  const message = document.getElementById("message");

  message.textContent = text;

  if (type === "success") {
    message.className = "success-message";
  } else {
    message.className = "error-message";
  }

  setTimeout(() => {
    message.textContent = "";
  }, 3000);
}
function clearForm() {
  document.getElementById("empId").value = "";

  document.getElementById("empName").value = "";
}
function renderAttendanceChart() {
  const chart = document.getElementById("attendanceChart");

  chart.innerHTML = "";

  const shifts = ["Morning", "Evening", "Night"];

  shifts.forEach((shift) => {
    const total = employees.filter((emp) => emp.shift === shift).length;

    const present = employees.filter(
      (emp) => emp.shift === shift && emp.status === "IN",
    ).length;

    const percentage = total > 0 ? (present / total) * 100 : 0;

    chart.innerHTML += `

        <div class="chart-column">

            <div
            class="chart-bar"
            style="height:${percentage}%">
            </div>

            <span>
                ${shift}
            </span>

        </div>

        `;
  });
}
let refreshTime = 15;

setInterval(() => {
  refreshTime--;

  document.getElementById("refreshCounter").textContent = refreshTime + "s";

  if (refreshTime <= 0) {
    refreshDashboard();

    refreshTime = 15;
  }
}, 1000);
async function addEmployee() {
  const id = document.getElementById("newEmpId").value.trim();

  const name = document.getElementById("newEmpName").value.trim();

  const shift = document.getElementById("newEmpShift").value;

  if (!id || !name) {
    alert("Please fill all fields");

    return;
  }

  const exists = employees.some((emp) => emp.id === id);

  if (exists) {
    alert("Employee ID already exists");

    return;
  }
  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "ADD_EMPLOYEE",
      id,
      name,
      shift,
    }),
  });

  employees.push({
    id: id,
    name: name,
    shift: shift,
    status: "OUT",
    lastMovement: "-",
  });

  refreshDashboard();

  alert("Employee Added Successfully");

  document.getElementById("newEmpId").value = "";

  document.getElementById("newEmpName").value = "";
}
async function deleteEmployee(id) {
  const confirmDelete = confirm("Delete this employee?");

  if (!confirmDelete) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "DELETE_EMPLOYEE",
      employeeId: id,
    }),
  });

  employees = employees.filter((emp) => emp.id !== id);

  refreshDashboard();

  alert("Employee Deleted Successfully");

  alert("Employee Deleted Successfully");
}
loadEmployees();
setInterval(() => {
  loadEmployees();
}, 15000);
