/**
 * ============================================================================
 * GYM WEIGHT TRACKER - SCRIPT.JS
 * ============================================================================
 * 
 * Educational Web Application for tracking daily weight, viewing weight history,
 * calculating weight deltas, and visualizing progress over time on a line chart.
 * 
 * Concepts covered for students:
 * 1. DOM Selection and Event Listeners
 * 2. Form Handling and Input Validation
 * 3. Array Manipulation (sorting, mapping, filtering)
 * 4. Persistent Client-Side Storage via localStorage
 * 5. Data interchange using JSON (JSON.stringify & JSON.parse)
 * 6. HTML5 Canvas rendering for dynamic 2D charts
 * 
 * ============================================================================
 */

// Global constants for localStorage key names
const STORAGE_KEY = 'gym_weight_tracker_data';
const GOAL_STORAGE_KEY = 'gym_goal_weight_kg';
const HEIGHT_STORAGE_KEY = 'gym_user_height_cm';

// Default example data matching weights.json (used as initial sample data)
const SAMPLE_WEIGHTS = [
  { "date": "2026-09-27", "weight": 83.2 },
  { "date": "2026-09-30", "weight": 82.8 },
  { "date": "2026-10-03", "weight": 82.4 }
];

// Main in-memory array holding all weight records
// Each record is an object: { date: "YYYY-MM-DD", weight: 82.1 }
let weightRecords = [];

// User preferences / targets state
let goalWeightKg = null;
let userHeightCm = 175; // default 175 cm

/* ============================================================================
   DOM ELEMENT REFERENCES
   We cache references to HTML elements we interact with for performance & clarity.
   ============================================================================ */
const weightForm = document.getElementById('weight-form');
const dateInput = document.getElementById('weight-date');
const weightInput = document.getElementById('weight-input');
const formFeedback = document.getElementById('form-feedback');
const clearBtn = document.getElementById('clear-btn');

// Dashboard Summary Elements
const heroCurrentWeight = document.getElementById('hero-current-weight');
const heroImperialText = document.getElementById('hero-imperial-text');
const heroDateBadge = document.getElementById('hero-date-badge');
const statStartWeight = document.getElementById('stat-start-weight');
const statStartImperial = document.getElementById('stat-start-imperial');
const statStartWeeks = document.getElementById('stat-start-weeks');
const statStartDate = document.getElementById('stat-start-date');
const statTotalChange = document.getElementById('stat-total-change');
const statTotalChangeImperial = document.getElementById('stat-total-change-imperial');
const statTotalChangeContainer = document.getElementById('stat-total-change-container');
const statProgressSubtext = document.getElementById('stat-progress-subtext');
const statProgressIcon = document.getElementById('stat-progress-icon');
const statCount = document.getElementById('stat-count');

// Daily Nutrition & BMI Elements
const targetCalories = document.getElementById('target-calories');
const targetCaloriesSubtext = document.getElementById('target-calories-subtext');
const targetProtein = document.getElementById('target-protein');
const targetProteinSubtext = document.getElementById('target-protein-subtext');
const statBmi = document.getElementById('stat-bmi');
const bmiBadge = document.getElementById('bmi-badge');
const statHeightDisplay = document.getElementById('stat-height-display');
const btnEditHeight = document.getElementById('btn-edit-height');

// Goal Weight Elements
const statGoalWeight = document.getElementById('stat-goal-weight');
const statGoalUnit = document.getElementById('stat-goal-unit');
const statGoalSubtext = document.getElementById('stat-goal-subtext');
const goalProgressBar = document.getElementById('goal-progress-bar');
const goalProgressBarContainer = document.getElementById('goal-progress-bar-container');
const btnResetGoal = document.getElementById('btn-reset-goal');

// Modals & Action Elements
const goalModal = document.getElementById('goal-modal');
const goalWeightInput = document.getElementById('goal-weight-input');
const goalImperialHint = document.getElementById('goal-imperial-hint');
const btnSaveGoal = document.getElementById('btn-save-goal');
const btnClearGoal = document.getElementById('btn-clear-goal');
const btnCancelGoal = document.getElementById('btn-cancel-goal');

const heightModal = document.getElementById('height-modal');
const heightInput = document.getElementById('height-input');
const btnSaveHeight = document.getElementById('btn-save-height');
const btnCancelHeight = document.getElementById('btn-cancel-height');

// Heaviest Weight Milestone Elements (23 stone 5 pounds benchmark)
const heaviestLostImperial = document.getElementById('heaviest-lost-imperial');
const heaviestLostLbsTotal = document.getElementById('heaviest-lost-lbs-total');
const heaviestLostKg = document.getElementById('heaviest-lost-kg');
const heaviestLostPercent = document.getElementById('heaviest-lost-percent');
const heaviestCurrentKg = document.getElementById('heaviest-current-kg');
const heaviestCurrentImperial = document.getElementById('heaviest-current-imperial');
const heaviestProgressBarFill = document.getElementById('heaviest-progress-bar-fill');
const heaviestProgressText = document.getElementById('heaviest-progress-text');

// Heaviest weight constants
// 23 stone 5 pounds = (23 * 14) + 5 = 327 pounds
// 327 lbs in kg = 327 * 0.45359237 kg = 148.32470499 kg (standard exact conversion)
const HEAVIEST_WEIGHT_STONE = 23;
const HEAVIEST_WEIGHT_LBS_PART = 5;
const HEAVIEST_TOTAL_LBS = (HEAVIEST_WEIGHT_STONE * 14) + HEAVIEST_WEIGHT_LBS_PART; // 327 lbs
const HEAVIEST_WEIGHT_KG = HEAVIEST_TOTAL_LBS * 0.45359237; // ~148.32 kg

// History Table Elements
const historyTbody = document.getElementById('history-tbody');
const emptyHistoryMessage = document.getElementById('empty-history-message');
const historyTable = document.getElementById('history-table');
const historyCountBadge = document.getElementById('history-count-badge');

// Canvas Chart Elements
const chartCanvas = document.getElementById('weight-chart');
const chartEmptyState = document.getElementById('chart-empty-state');


/* ============================================================================
   DATE HELPER FUNCTIONS
   ============================================================================ */

/**
 * Returns today's date in local 'YYYY-MM-DD' format.
 * Using local date getters prevents UTC timezone shift bugs.
 */
function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO date string ('2026-10-03') to display format ('03/10/2026').
 * @param {string} isoDate - Date string in YYYY-MM-DD format
 * @returns {string} - Date formatted as DD/MM/YYYY
 */
function formatDisplayDate(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Formats an ISO date string ('2026-10-03') to a short chart label ('03 Oct').
 * @param {string} isoDate - Date string in YYYY-MM-DD format
 * @returns {string} - Short label
 */
function formatShortDate(isoDate) {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month, 10) - 1;
  return `${day} ${monthNames[monthIdx] || month}`;
}

/**
 * Converts weight in kilograms to Stone and Pounds (UK gym units).
 * Formula:
 * 1 stone = 14 pounds (lbs).
 * 1 kg ≈ 2.20462262 pounds.
 * 
 * Example: 82.4 kg -> "12 st 13.7 lbs"
 * 
 * @param {number} kg - Weight in kilograms
 * @returns {string} - Formatted string (e.g. "12 st 13.7 lbs")
 */
function kgToStoneAndPounds(kg) {
  if (kg === null || kg === undefined || isNaN(kg) || kg <= 0) {
    return '-- st -- lbs';
  }
  const totalLbs = kg * 2.20462262185;
  let stones = Math.floor(totalLbs / 14);
  let remainingLbs = Number((totalLbs % 14).toFixed(1));

  // If decimal rounding yields 14.0, increment stone and reset lbs to 0
  if (remainingLbs >= 14) {
    stones += 1;
    remainingLbs = 0;
  }

  return `${stones} st ${remainingLbs} lbs`;
}

/**
 * Converts a weight difference in kilograms to signed Stone and Pounds.
 * Example: -0.4 kg -> "-0 st 0.9 lbs"
 * Example: -7.5 kg -> "-1 st 2.5 lbs"
 * Example: +1.2 kg -> "+0 st 2.6 lbs"
 * 
 * @param {number} diffKg - Weight difference in kg
 * @returns {string} - Signed stone and pounds difference
 */
function kgDiffToStoneAndPounds(diffKg) {
  if (diffKg === null || diffKg === undefined || isNaN(diffKg)) {
    return '—';
  }
  if (diffKg === 0) {
    return '0 st 0.0 lbs';
  }
  const sign = diffKg < 0 ? '-' : '+';
  const absKg = Math.abs(diffKg);
  const totalLbs = absKg * 2.20462262185;
  let stones = Math.floor(totalLbs / 14);
  let remainingLbs = Number((totalLbs % 14).toFixed(1));

  if (remainingLbs >= 14) {
    stones += 1;
    remainingLbs = 0;
  }

  return `${sign}${stones} st ${remainingLbs} lbs`;
}

/**
 * Calculates how many weeks have gone by since the start date.
 * Compares the first weigh-in date to today's date (or the latest weigh-in).
 * 
 * @param {string} startDateStr - ISO start date (YYYY-MM-DD)
 * @param {string} latestDateStr - ISO latest record date (YYYY-MM-DD)
 * @returns {string} - Formatted string (e.g. "1.0 week gone by (7 days)")
 */
function calculateWeeksElapsed(startDateStr, latestDateStr) {
  if (!startDateStr) return '-- weeks gone by';
  
  const start = new Date(startDateStr + 'T00:00:00');
  const latest = latestDateStr ? new Date(latestDateStr + 'T00:00:00') : start;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // End date is today or latest record date, whichever is later
  const endDate = today > latest ? today : latest;

  const diffMs = endDate - start;
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  
  const weeks = diffDays / 7;
  const weeksFormatted = (Math.round(weeks * 10) / 10).toFixed(1);

  if (diffDays === 0) {
    return 'Started today (Day 1)';
  } else if (diffDays === 1) {
    return '0.1 weeks gone by (1 day)';
  } else if (diffDays === 7) {
    return '1.0 week gone by (7 days)';
  } else {
    const label = Number(weeksFormatted) === 1.0 ? 'week' : 'weeks';
    return `${weeksFormatted} ${label} gone by (${diffDays} days)`;
  }
}

/**
 * Calculates weight in pounds (lbs) from kilograms.
 * 1 kg ≈ 2.20462262 lbs.
 * 
 * @param {number} kg - Weight in kilograms
 * @returns {number} - Weight in pounds
 */
function kgToPounds(kg) {
  if (!kg || isNaN(kg) || kg <= 0) return 0;
  return kg * 2.20462262185;
}

/**
 * Calculates total daily calories from bodyweight in pounds with a 500 kcal deficit adjustment.
 * Formula requested: (current pounds × 12) - 500
 * 
 * @param {number} lbs - Weight in pounds
 * @returns {number} - Total calories in kcal
 */
function calculateDailyCalories(lbs) {
  if (!lbs || lbs <= 0) return 0;
  const maintenance = Math.round(lbs * 12);
  // Deficit adjustment of -500 kcal
  return Math.max(0, maintenance - 500);
}

/**
 * Calculates total daily protein in grams from bodyweight in pounds.
 * User requirement: current pounds × 1 (1g per lb of bodyweight)
 * 
 * @param {number} lbs - Weight in pounds
 * @returns {number} - Total protein in grams
 */
function calculateDailyProtein(lbs) {
  if (!lbs || lbs <= 0) return 0;
  return Math.round(lbs * 1);
}

/**
 * Calculates Body Mass Index (BMI).
 * Standard Formula: weight (kg) / (height in meters)²
 * 
 * @param {number} weightKg - Body weight in kg
 * @param {number} heightCm - Height in centimeters
 * @returns {number|null} - Calculated BMI rounded to 1 decimal
 */
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

/**
 * Returns WHO classification label and CSS class for a given BMI.
 * 
 * @param {number} bmi - Calculated BMI
 * @returns {{ label: string, className: string }}
 */
function getBMICategory(bmi) {
  if (!bmi) return { label: '', className: '' };
  if (bmi < 18.5) {
    return { label: 'Underweight', className: 'bmi-underweight' };
  } else if (bmi < 25.0) {
    return { label: 'Normal (Healthy)', className: 'bmi-normal' };
  } else if (bmi < 30.0) {
    return { label: 'Overweight', className: 'bmi-overweight' };
  } else {
    return { label: 'Obese', className: 'bmi-obese' };
  }
}


/* ============================================================================
   DATA PERSISTENCE & LOCALSTORAGE (JSON Handling)
   ============================================================================ */

/**
 * Saves current weight records array into browser's localStorage.
 * Converts JavaScript array into a JSON string using JSON.stringify().
 */
function saveRecordsToStorage() {
  try {
    const jsonString = JSON.stringify(weightRecords);
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    console.error('Error saving data to localStorage:', error);
    showFeedback('Could not save data to browser storage.', 'error');
  }
}

/**
 * Loads records from browser localStorage or initializes from weights.json.
 * Also loads user's goal weight and height settings from localStorage.
 */
async function loadInitialData() {
  // 1. Load saved goal weight (if any)
  const savedGoal = localStorage.getItem(GOAL_STORAGE_KEY);
  if (savedGoal !== null && !isNaN(parseFloat(savedGoal))) {
    goalWeightKg = parseFloat(savedGoal);
  } else {
    // Initial sample goal weight: 78.0 kg
    goalWeightKg = 78.0;
    localStorage.setItem(GOAL_STORAGE_KEY, '78.0');
  }

  // 2. Load saved height in cm (if any)
  const savedHeight = localStorage.getItem(HEIGHT_STORAGE_KEY);
  if (savedHeight !== null && !isNaN(parseInt(savedHeight, 10))) {
    userHeightCm = parseInt(savedHeight, 10);
  } else {
    userHeightCm = 175;
    localStorage.setItem(HEIGHT_STORAGE_KEY, '175');
  }

  // 3. Load weight records
  const storedJson = localStorage.getItem(STORAGE_KEY);

  if (storedJson) {
    try {
      const parsedData = JSON.parse(storedJson);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        weightRecords = parsedData;
        console.log(`Loaded ${weightRecords.length} records from localStorage.`);
        updateUI();
        return;
      }
    } catch (parseError) {
      console.warn('Malformed data in localStorage, loading sample data instead:', parseError);
    }
  }

  // If no stored data exists in localStorage, try fetching from weights.json
  try {
    const response = await fetch('weights.json');
    if (response.ok) {
      const jsonData = await response.json();
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        weightRecords = jsonData;
        saveRecordsToStorage();
        console.log(`Initialized with ${weightRecords.length} records from weights.json.`);
        updateUI();
        return;
      }
    }
  } catch (fetchError) {
    console.info('Fetch for weights.json was blocked (e.g. running via file:// protocol). Using embedded sample data.', fetchError);
  }

  // Fallback if fetch fails or file protocol blocks network requests
  weightRecords = JSON.parse(JSON.stringify(SAMPLE_WEIGHTS));
  saveRecordsToStorage();
  updateUI();
}


/* ============================================================================
   CALCULATIONS & DATA PREPARATION
   ============================================================================ */

/**
 * Returns a new array of records sorted in ascending chronological order (oldest first).
 * This order is essential for correctly calculating weight change between consecutive weigh-ins.
 */
function getChronologicalRecords() {
  return [...weightRecords].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Processes records to calculate consecutive weight changes.
 * Weight loss is represented as a negative number (-0.4).
 * Weight gain is represented as a positive number (+0.6).
 * The baseline (first) entry has a null change.
 * 
 * @returns {Array} - Chronologically sorted array of entries with calculated `change`
 */
function getRecordsWithDifferences() {
  const chrono = getChronologicalRecords();

  return chrono.map((entry, index) => {
    let change = null;

    if (index > 0) {
      const prevWeight = Number(chrono[index - 1].weight);
      const currWeight = Number(entry.weight);
      // Difference = current weight - previous weight
      // Round to 1 decimal place to prevent floating point inaccuracies (e.g., 0.1000000000000014)
      change = Number((currWeight - prevWeight).toFixed(1));
    }

    return {
      date: entry.date,
      weight: Number(entry.weight),
      change: change
    };
  });
}


/* ============================================================================
   UI RENDERING FUNCTIONS
   ============================================================================ */

/**
 * Master UI updater: refreshes the summary stats, history table, and graph.
 */
function updateUI() {
  renderDashboardSummary();
  renderHistoryTable();
  renderProgressChart();
}

/**
 * 1. Render Dashboard Summary:
 * Displays Current Weight, Starting Weight, Total Lost/Gained, and Weigh-in Count.
 */
function renderDashboardSummary() {
  const chrono = getChronologicalRecords();
  const totalCount = chrono.length;

  statCount.textContent = totalCount;
  historyCountBadge.textContent = `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`;

  // Reset classes for total change display
  statTotalChangeContainer.className = 'card-value';

  if (totalCount === 0) {
    heroCurrentWeight.textContent = '--';
    heroImperialText.textContent = '-- st -- lbs';
    heroDateBadge.textContent = 'No weigh-ins yet';
    statStartWeight.textContent = '--';
    statStartImperial.textContent = '-- st -- lbs';
    statStartWeeks.textContent = '-- weeks gone by';
    statStartDate.textContent = 'First weigh-in';
    statTotalChange.textContent = '--';
    statTotalChangeImperial.textContent = '-- st -- lbs';
    statProgressSubtext.textContent = 'Overall progress';
    statProgressIcon.textContent = '⚖️';

    // Reset Nutrition & Health targets
    targetCalories.textContent = '--';
    targetCaloriesSubtext.textContent = '(Current lbs × 12) - 500';
    targetProtein.textContent = '--';
    targetProteinSubtext.textContent = 'Current lbs × 1g';
    statBmi.textContent = '--';
    bmiBadge.classList.add('hidden');
    statGoalSubtext.textContent = goalWeightKg ? `Goal: ${goalWeightKg} kg` : 'No goal set';
    goalProgressBar.style.width = '0%';
    renderHeaviestWeightSection(null);
    return;
  }

  // First chronologically recorded weight
  const firstRecord = chrono[0];
  // Most recent chronologically recorded weight
  const latestRecord = chrono[chrono.length - 1];

  const currentKg = latestRecord.weight;
  const startKg = firstRecord.weight;

  // 1. Current Weight (displayed in KG and Stone & Pounds)
  heroCurrentWeight.textContent = currentKg.toFixed(1);
  heroImperialText.textContent = kgToStoneAndPounds(currentKg);
  heroDateBadge.textContent = `Latest: ${formatDisplayDate(latestRecord.date)}`;

  // 2. Starting Weight (displayed in KG, Stone & Pounds, and Weeks Gone By)
  statStartWeight.textContent = startKg.toFixed(1);
  statStartImperial.textContent = kgToStoneAndPounds(startKg);
  statStartWeeks.textContent = calculateWeeksElapsed(firstRecord.date, latestRecord.date);
  statStartDate.textContent = `Started: ${formatDisplayDate(firstRecord.date)}`;

  // 3. Total Progress (Current - Start in KG and Stone & Pounds)
  if (totalCount === 1) {
    statTotalChange.textContent = '0.0';
    statTotalChangeImperial.textContent = '0 st 0.0 lbs';
    statProgressSubtext.textContent = 'Baseline weigh-in recorded';
    statProgressIcon.textContent = '🎯';
    statTotalChangeContainer.classList.add('change-neutral');
  } else {
    const totalDiff = Number((currentKg - startKg).toFixed(1));
    const imperialDiff = kgDiffToStoneAndPounds(totalDiff);
    statTotalChangeImperial.textContent = imperialDiff;
    
    if (totalDiff < 0) {
      // Weight Lost (Negative difference)
      statTotalChange.textContent = totalDiff.toFixed(1);
      statProgressSubtext.textContent = `${Math.abs(totalDiff).toFixed(1)} kg (${Math.abs(kgToPounds(currentKg) - kgToPounds(startKg)).toFixed(1)} lbs) lost since start`;
      statProgressIcon.textContent = '📉';
      statTotalChangeContainer.classList.add('change-loss');
    } else if (totalDiff > 0) {
      // Weight Gained (Positive difference)
      statTotalChange.textContent = `+${totalDiff.toFixed(1)}`;
      statProgressSubtext.textContent = `${totalDiff.toFixed(1)} kg (${(kgToPounds(currentKg) - kgToPounds(startKg)).toFixed(1)} lbs) gained since start`;
      statProgressIcon.textContent = '📈';
      statTotalChangeContainer.classList.add('change-gain');
    } else {
      // No Net Change
      statTotalChange.textContent = '0.0';
      statProgressSubtext.textContent = 'No net change from starting weight';
      statProgressIcon.textContent = '⚖️';
      statTotalChangeContainer.classList.add('change-neutral');
    }
  }

  // 4. Daily Calories Target (Formula requested: (current pounds × 12) - 500)
  const currentLbs = kgToPounds(currentKg);
  const dailyCalories = calculateDailyCalories(currentLbs);
  targetCalories.textContent = dailyCalories.toLocaleString();
  targetCaloriesSubtext.textContent = `(${currentLbs.toFixed(1)} lbs × 12) - 500 kcal`;

  // 5. Daily Protein Target (Formula requested: current pounds × 1)
  const dailyProtein = calculateDailyProtein(currentLbs);
  targetProtein.textContent = dailyProtein.toLocaleString();
  targetProteinSubtext.textContent = `${currentLbs.toFixed(1)} lbs × 1g`;

  // 6. BMI (Body Mass Index) Calculation
  statHeightDisplay.textContent = `Height: ${userHeightCm} cm`;
  const bmi = calculateBMI(currentKg, userHeightCm);
  if (bmi !== null) {
    statBmi.textContent = bmi.toFixed(1);
    const category = getBMICategory(bmi);
    bmiBadge.textContent = category.label;
    bmiBadge.className = `badge-bmi ${category.className}`;
    bmiBadge.classList.remove('hidden');
  } else {
    statBmi.textContent = '--';
    bmiBadge.classList.add('hidden');
  }

  // 7. Goal Weight & Progress Visualization
  if (goalWeightKg !== null) {
    statGoalWeight.textContent = goalWeightKg.toFixed(1);
    statGoalUnit.textContent = 'kg';
    const goalDiff = Number((currentKg - goalWeightKg).toFixed(1));

    if (goalDiff > 0) {
      statGoalSubtext.textContent = `${goalDiff.toFixed(1)} kg to lose to goal (${kgToStoneAndPounds(goalWeightKg)})`;
    } else if (goalDiff < 0) {
      statGoalSubtext.textContent = `${Math.abs(goalDiff).toFixed(1)} kg to gain to goal (${kgToStoneAndPounds(goalWeightKg)})`;
    } else {
      statGoalSubtext.textContent = `Goal reached! 🏆 (${kgToStoneAndPounds(goalWeightKg)})`;
    }

    // Progress Bar calculation towards goal
    const targetDelta = Math.abs(startKg - goalWeightKg);
    if (targetDelta > 0) {
      const actualDelta = Math.abs(startKg - currentKg);
      let percent = Math.round((actualDelta / targetDelta) * 100);
      if (goalDiff === 0 || (startKg > goalWeightKg && currentKg <= goalWeightKg) || (startKg < goalWeightKg && currentKg >= goalWeightKg)) {
        percent = 100;
      } else {
        percent = Math.max(0, Math.min(100, percent));
      }
      goalProgressBar.style.width = `${percent}%`;
    } else {
      goalProgressBar.style.width = '100%';
    }
  } else {
    statGoalWeight.textContent = '--';
    statGoalSubtext.textContent = 'No goal set — click to set';
    goalProgressBar.style.width = '0%';
  }

  // 8. Heaviest Weight Transformation Section (23 stone 5 pounds benchmark)
  renderHeaviestWeightSection(currentKg);
}

/**
 * 1B. Render Heaviest Weight Transformation Section:
 * Benchmark: 23 stone 5 pounds (327 lbs / 148.32 kg) was the user's heaviest weight.
 * Compares current weight to compute:
 * - Stone and pounds lost
 * - Kilograms lost
 * - Total imperial pounds lost
 * - Percentage of peak body weight lost
 * 
 * @param {number|null} currentKg - Current body weight in kilograms
 */
function renderHeaviestWeightSection(currentKg) {
  if (!heaviestLostImperial || !heaviestLostKg) return;

  if (currentKg === null || currentKg === undefined || isNaN(currentKg) || currentKg <= 0) {
    heaviestLostImperial.textContent = '-- st -- lbs';
    heaviestLostLbsTotal.textContent = '-- lbs total loss';
    heaviestLostKg.textContent = '--';
    heaviestLostPercent.textContent = '--% of peak weight lost';
    heaviestCurrentKg.textContent = '--';
    heaviestCurrentImperial.textContent = '-- st -- lbs';
    if (heaviestProgressBarFill) heaviestProgressBarFill.style.width = '0%';
    if (heaviestProgressText) heaviestProgressText.textContent = '0% lost';
    return;
  }

  // Current weight imperial representation
  const currentLbs = kgToPounds(currentKg);
  heaviestCurrentKg.textContent = currentKg.toFixed(1);
  heaviestCurrentImperial.textContent = kgToStoneAndPounds(currentKg);

  // Weight lost calculation from heaviest weight (23 stone 5 lbs = 327 lbs, ~148.32 kg)
  const lbsLost = HEAVIEST_TOTAL_LBS - currentLbs;
  const kgLost = Number((HEAVIEST_WEIGHT_KG - currentKg).toFixed(1));

  let stonesLost = Math.floor(Math.abs(lbsLost) / 14);
  let remLbsLost = Number((Math.abs(lbsLost) % 14).toFixed(1));

  if (remLbsLost >= 14) {
    stonesLost += 1;
    remLbsLost = 0;
  }

  if (lbsLost >= 0) {
    // Normal case: user has lost weight from peak 23 stone 5 pounds!
    heaviestLostImperial.textContent = `${stonesLost} st ${remLbsLost} lbs lost`;
    heaviestLostLbsTotal.textContent = `${lbsLost.toFixed(1)} lbs total loss`;
    heaviestLostKg.textContent = `${kgLost.toFixed(1)}`;

    const percentLost = Math.min(100, Math.max(0, (lbsLost / HEAVIEST_TOTAL_LBS) * 100));
    heaviestLostPercent.textContent = `${percentLost.toFixed(1)}% of peak weight lost`;
    if (heaviestProgressBarFill) heaviestProgressBarFill.style.width = `${percentLost.toFixed(1)}%`;
    if (heaviestProgressText) heaviestProgressText.textContent = `${percentLost.toFixed(1)}% lost (${stonesLost} st ${remLbsLost} lbs)`;
  } else {
    // Edge case: current weight is above peak
    const overKg = Math.abs(kgLost).toFixed(1);
    heaviestLostImperial.textContent = `+${stonesLost} st ${remLbsLost} lbs`;
    heaviestLostLbsTotal.textContent = `${Math.abs(lbsLost).toFixed(1)} lbs above peak`;
    heaviestLostKg.textContent = `+${overKg}`;
    heaviestLostPercent.textContent = `Above peak weight`;
    if (heaviestProgressBarFill) heaviestProgressBarFill.style.width = '0%';
    if (heaviestProgressText) heaviestProgressText.textContent = '0% lost';
  }
}

/**
 * 2. Render Weight History Table:
 * Displays Date, Weight, Change, and Delete button.
 * Newest entry is displayed first.
 */
function renderHistoryTable() {
  const recordsWithDiff = getRecordsWithDifferences();

  // Clear existing table rows
  historyTbody.innerHTML = '';

  if (recordsWithDiff.length === 0) {
    historyTable.classList.add('hidden');
    emptyHistoryMessage.classList.remove('hidden');
    return;
  }

  historyTable.classList.remove('hidden');
  emptyHistoryMessage.classList.add('hidden');

  // Reverse so newest entries appear at the top of the table
  const newestFirst = [...recordsWithDiff].reverse();

  newestFirst.forEach((entry) => {
    const tr = document.createElement('tr');

    // Date Cell (formatted as DD/MM/YYYY)
    const tdDate = document.createElement('td');
    tdDate.textContent = formatDisplayDate(entry.date);

    // Weight Cell (e.g. 82.5 kg with stone & pounds)
    const tdWeight = document.createElement('td');
    tdWeight.className = 'weight-cell';
    
    const kgDiv = document.createElement('div');
    kgDiv.textContent = `${entry.weight.toFixed(1)} kg`;
    
    const imperialSpan = document.createElement('span');
    imperialSpan.className = 'table-sub-imperial';
    imperialSpan.textContent = kgToStoneAndPounds(entry.weight);
    
    tdWeight.appendChild(kgDiv);
    tdWeight.appendChild(imperialSpan);

    // Change Cell (displays change from last input in KG and Stone & Pounds)
    const tdChange = document.createElement('td');

    if (entry.change === null) {
      // Baseline / First entry
      const badge = document.createElement('span');
      badge.className = 'diff-badge neutral';
      badge.textContent = '—';
      tdChange.appendChild(badge);
    } else {
      const diffContainer = document.createElement('div');
      diffContainer.className = 'diff-cell-container';

      const badge = document.createElement('span');
      badge.className = 'diff-badge';

      if (entry.change < 0) {
        // Weight Loss: negative number
        badge.classList.add('loss');
        badge.textContent = `${entry.change.toFixed(1)} kg`;
      } else if (entry.change > 0) {
        // Weight Gain: positive number with '+' prefix
        badge.classList.add('gain');
        badge.textContent = `+${entry.change.toFixed(1)} kg`;
      } else {
        // Exact zero difference
        badge.classList.add('neutral');
        badge.textContent = `0.0 kg`;
      }

      // Stone & pounds change from last input
      const imperialChangeSpan = document.createElement('span');
      imperialChangeSpan.className = 'table-sub-imperial';
      imperialChangeSpan.textContent = kgDiffToStoneAndPounds(entry.change);

      diffContainer.appendChild(badge);
      diffContainer.appendChild(imperialChangeSpan);
      tdChange.appendChild(diffContainer);
    }

    // Action Cell: Delete Button
    const tdAction = document.createElement('td');
    tdAction.className = 'text-right';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete record for ${formatDisplayDate(entry.date)}`);

    // Attach click handler to delete this specific record
    deleteBtn.addEventListener('click', () => {
      handleDeleteRecord(entry.date, entry.weight);
    });

    tdAction.appendChild(deleteBtn);

    // Append cells to row
    tr.appendChild(tdDate);
    tr.appendChild(tdWeight);
    tr.appendChild(tdChange);
    tr.appendChild(tdAction);

    historyTbody.appendChild(tr);
  });
}

/**
 * 3. Render Progress Graph (Canvas Line Chart):
 * Draws Weight (kg) over time on a high-DPI responsive canvas.
 */
function renderProgressChart() {
  const chrono = getChronologicalRecords();

  if (chrono.length < 2) {
    chartCanvas.style.display = 'none';
    chartEmptyState.classList.remove('hidden');
    return;
  }

  chartCanvas.style.display = 'block';
  chartEmptyState.classList.add('hidden');

  const ctx = chartCanvas.getContext('2d');
  if (!ctx) return;

  // Handle High-DPI screens (Retina) for super-crisp lines and text
  const dpr = window.devicePixelRatio || 1;
  const containerWidth = chartCanvas.parentElement ? chartCanvas.parentElement.clientWidth : 0;
  const displayWidth = containerWidth > 50 ? containerWidth : (chartCanvas.clientWidth || 500);
  const displayHeight = 260;

  chartCanvas.width = displayWidth * dpr;
  chartCanvas.height = displayHeight * dpr;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  const width = displayWidth;
  const height = displayHeight;

  // Margins for axes, labels, and padding
  const padding = { top: 35, right: 30, bottom: 45, left: 60 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Clear previous canvas drawing
  ctx.clearRect(0, 0, width, height);

  // Extract weight numbers, including goal weight if set
  const weights = chrono.map(item => item.weight);
  const allScaleValues = [...weights];
  if (goalWeightKg !== null) {
    allScaleValues.push(goalWeightKg);
  }
  const minW = Math.min(...allScaleValues);
  const maxW = Math.max(...allScaleValues);

  // Add buffer to min and max so the line doesn't hug the canvas borders
  const weightBuffer = Math.max(0.5, (maxW - minW) * 0.15 || 1);
  const yMin = Math.floor((minW - weightBuffer) * 10) / 10;
  const yMax = Math.ceil((maxW + weightBuffer) * 10) / 10;
  const yRange = yMax - yMin || 1;

  // Coordinate helper functions
  const getX = (index) => {
    if (chrono.length === 1) return padding.left + graphWidth / 2;
    return padding.left + (index / (chrono.length - 1)) * graphWidth;
  };

  const getY = (weight) => {
    return padding.top + graphHeight - ((weight - yMin) / yRange) * graphHeight;
  };

  // --- Draw Horizontal Grid Lines & Y-Axis Labels (kg) ---
  const yTicks = 4;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  for (let i = 0; i <= yTicks; i++) {
    const tickWeight = yMin + (i / yTicks) * yRange;
    const yPos = getY(tickWeight);

    // Grid line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]); // Dashed guide lines
    ctx.moveTo(padding.left, yPos);
    ctx.lineTo(width - padding.right, yPos);
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // Y-Axis kg label
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${tickWeight.toFixed(1)} kg`, padding.left - 10, yPos);
  }

  // --- Draw Goal Weight Target Line (if set) ---
  if (goalWeightKg !== null) {
    const goalY = getY(goalWeightKg);
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b'; // Amber gold
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(padding.left, goalY);
    ctx.lineTo(width - padding.right, goalY);
    ctx.stroke();

    // Goal text label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Target Goal: ${goalWeightKg.toFixed(1)} kg`, width - padding.right, goalY - 4);
    ctx.restore();
  }

  // --- Draw Shaded Gradient Fill Under the Line ---
  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  areaGradient.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
  areaGradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

  ctx.beginPath();
  chrono.forEach((item, index) => {
    const x = getX(index);
    const y = getY(item.weight);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  // Close the area path down to the baseline
  ctx.lineTo(getX(chrono.length - 1), height - padding.bottom);
  ctx.lineTo(getX(0), height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();

  // --- Draw Line Chart Curve ---
  ctx.beginPath();
  ctx.strokeStyle = '#10b981'; // Energetic fitness green
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  chrono.forEach((item, index) => {
    const x = getX(index);
    const y = getY(item.weight);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.stroke();

  // --- Draw Data Points and Labels (Weight and Date) ---
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  chrono.forEach((item, index) => {
    const x = getX(index);
    const y = getY(item.weight);

    // Glowing outer ring for data point
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fill();

    // Solid inner point
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();

    // Weight Value Label above point (e.g. 82.4)
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${item.weight.toFixed(1)}`, x, y - 9);

    // X-Axis Date Label below point
    ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(formatShortDate(item.date), x, height - padding.bottom + 18);
  });
}


/* ============================================================================
   USER ACTIONS & EVENT HANDLERS
   ============================================================================ */

/**
 * Validates and saves a new weight record.
 * @param {Event} event - Submit event from the form
 */
function handleSaveWeight(event) {
  event.preventDefault();

  // 1. Read input values
  const dateValue = dateInput.value.trim();
  const weightRawValue = weightInput.value.trim();

  // 2. Validate that both fields contain values
  if (!dateValue || !weightRawValue) {
    showFeedback('Please provide both a date and a weight value.', 'error');
    return;
  }

  const weightNum = parseFloat(weightRawValue);

  // 3. Prevent impossible or negative weight values
  if (isNaN(weightNum)) {
    showFeedback('Please enter a valid numeric weight.', 'error');
    weightInput.focus();
    return;
  }

  if (weightNum <= 0) {
    showFeedback('Weight must be a positive number greater than zero.', 'error');
    weightInput.focus();
    return;
  }

  // Realistic human body weight boundary check (20kg to 500kg)
  if (weightNum < 20 || weightNum > 500) {
    showFeedback('Please enter a realistic weight value between 20 kg and 500 kg.', 'error');
    weightInput.focus();
    return;
  }

  // 4. Create weight record object
  // Structure: { "date": "YYYY-MM-DD", "weight": 82.1 }
  const newRecord = {
    date: dateValue,
    weight: Number(weightNum.toFixed(1))
  };

  // Check if an entry for this exact date already exists; if so, update or append
  const existingIndex = weightRecords.findIndex(r => r.date === newRecord.date);
  if (existingIndex !== -1) {
    // Overwrite the weight for that existing date
    weightRecords[existingIndex].weight = newRecord.weight;
    showFeedback(`Updated weight for ${formatDisplayDate(newRecord.date)} to ${newRecord.weight} kg!`, 'success');
  } else {
    // Append the new entry
    weightRecords.push(newRecord);
    showFeedback(`Saved ${newRecord.weight} kg for ${formatDisplayDate(newRecord.date)}!`, 'success');
  }

  // 5. Save to localStorage
  saveRecordsToStorage();

  // 6. Refresh UI (Summary, History table, and Graph)
  updateUI();

  // 7. Clear the weight input for the next entry while retaining today's date
  weightInput.value = '';
  weightInput.focus();
}

/**
 * Deletes a weight record matching the provided date and weight.
 * @param {string} date - Date of the record to delete
 * @param {number} weight - Weight of the record to delete
 */
function handleDeleteRecord(date, weight) {
  const targetIndex = weightRecords.findIndex(r => r.date === date && Number(r.weight) === Number(weight));
  
  if (targetIndex !== -1) {
    // Remove element from array
    weightRecords.splice(targetIndex, 1);
    
    // Save updated array to localStorage
    saveRecordsToStorage();
    
    // Refresh UI
    updateUI();
    
    showFeedback(`Deleted entry for ${formatDisplayDate(date)}.`, 'success');
  }
}

/**
 * Resets the form inputs to initial states (today's date and empty weight).
 */
function handleClearForm() {
  dateInput.value = getTodayDateString();
  weightInput.value = '';
  hideFeedback();
  weightInput.focus();
}

/**
 * Displays a temporary status/feedback message to the user.
 * @param {string} message - Feedback text to display
 * @param {string} type - 'error' or 'success'
 */
function showFeedback(message, type) {
  formFeedback.textContent = message;
  formFeedback.className = `feedback-msg ${type}`;
  
  // Clear any existing timer
  if (window._feedbackTimeout) {
    clearTimeout(window._feedbackTimeout);
  }

  // Auto-hide feedback message after 4 seconds
  window._feedbackTimeout = setTimeout(() => {
    hideFeedback();
  }, 4000);
}

/**
 * Hides the feedback message.
 */
function hideFeedback() {
  formFeedback.textContent = '';
  formFeedback.className = 'feedback-msg';
}


/**
 * Opens the Goal Weight modal.
 */
function handleOpenGoalModal() {
  goalWeightInput.value = goalWeightKg ? goalWeightKg : '';
  updateGoalHint();
  goalModal.classList.remove('hidden');
  goalWeightInput.focus();
}

/**
 * Updates the helper hint inside goal modal to show stone & pounds live.
 */
function updateGoalHint() {
  const val = parseFloat(goalWeightInput.value);
  if (!isNaN(val) && val > 0) {
    goalImperialHint.textContent = `Equivalent to: ${kgToStoneAndPounds(val)}`;
  } else {
    goalImperialHint.textContent = 'Accepts decimals (e.g. 78.5 kg)';
  }
}

/**
 * Closes the Goal Weight modal.
 */
function handleCloseGoalModal() {
  goalModal.classList.add('hidden');
}

/**
 * Saves a new goal weight entered by the user.
 */
function handleSaveGoal() {
  const rawVal = goalWeightInput.value.trim();
  const val = parseFloat(rawVal);

  if (isNaN(val) || val < 20 || val > 500) {
    alert('Please enter a realistic target goal weight between 20 kg and 500 kg.');
    goalWeightInput.focus();
    return;
  }

  goalWeightKg = Number(val.toFixed(1));
  localStorage.setItem(GOAL_STORAGE_KEY, goalWeightKg.toString());
  handleCloseGoalModal();
  updateUI();
  showFeedback(`Goal weight updated to ${goalWeightKg} kg (${kgToStoneAndPounds(goalWeightKg)})!`, 'success');
}

/**
 * Resets / clears the user's goal weight completely.
 */
function handleResetGoalWeight() {
  if (confirm('Reset your goal weight? Your target will be cleared.')) {
    goalWeightKg = null;
    localStorage.removeItem(GOAL_STORAGE_KEY);
    handleCloseGoalModal();
    updateUI();
    showFeedback('Goal weight has been reset.', 'success');
  }
}

/**
 * Opens the Height modal for BMI.
 */
function handleOpenHeightModal() {
  heightInput.value = userHeightCm;
  heightModal.classList.remove('hidden');
  heightInput.focus();
}

/**
 * Closes the Height modal.
 */
function handleCloseHeightModal() {
  heightModal.classList.add('hidden');
}

/**
 * Saves the user's updated height.
 */
function handleSaveHeight() {
  const val = parseInt(heightInput.value.trim(), 10);
  if (isNaN(val) || val < 100 || val > 250) {
    alert('Please enter a valid height between 100 cm and 250 cm.');
    heightInput.focus();
    return;
  }

  userHeightCm = val;
  localStorage.setItem(HEIGHT_STORAGE_KEY, userHeightCm.toString());
  handleCloseHeightModal();
  updateUI();
  showFeedback(`Height updated to ${userHeightCm} cm. BMI recalculated!`, 'success');
}


/* ============================================================================
   APPLICATION INITIALIZATION
   Runs when the DOM is fully loaded.
   ============================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Automatically set the date field to today's date when page loads
  dateInput.value = getTodayDateString();

  // 2. Attach Form Event Listeners
  weightForm.addEventListener('submit', handleSaveWeight);
  clearBtn.addEventListener('click', handleClearForm);

  // 3. Goal Weight & Reset Goal Event Listeners
  btnResetGoal.addEventListener('click', handleOpenGoalModal);
  btnSaveGoal.addEventListener('click', handleSaveGoal);
  btnClearGoal.addEventListener('click', handleResetGoalWeight);
  btnCancelGoal.addEventListener('click', handleCloseGoalModal);
  goalWeightInput.addEventListener('input', updateGoalHint);

  // 4. Height & BMI Event Listeners
  btnEditHeight.addEventListener('click', handleOpenHeightModal);
  btnSaveHeight.addEventListener('click', handleSaveHeight);
  btnCancelHeight.addEventListener('click', handleCloseHeightModal);

  // Close modals when clicking outside dialog backdrop
  window.addEventListener('click', (event) => {
    if (event.target === goalModal) handleCloseGoalModal();
    if (event.target === heightModal) handleCloseHeightModal();
  });

  // Close modals with Escape key
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      handleCloseGoalModal();
      handleCloseHeightModal();
    }
  });

  // 5. Redraw chart smoothly when the browser window is resized
  window.addEventListener('resize', () => {
    renderProgressChart();
  });

  // 6. Load data from localStorage (or weights.json fallback) and render UI
  loadInitialData();
});


/* ============================================================================
   PROGRESSIVE WEB APP (PWA) & SERVICE WORKER REGISTRATION
   Enables Android installation and offline caching.
   ============================================================================ */

// 1. Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.info('[PWA] Service Worker registration info (requires http/https):', error.message);
      });
  });
}

// 2. Manage Android Install Prompt
let deferredPrompt = null;
const installPwaBtn = document.getElementById('install-pwa-btn');

window.addEventListener('beforeinstallprompt', (event) => {
  // Prevent immediate automatic banner to control display
  event.preventDefault();
  deferredPrompt = event;

  // Reveal the "📱 Install App" button in the header
  if (installPwaBtn) {
    installPwaBtn.classList.remove('hidden');
  }
});

if (installPwaBtn) {
  installPwaBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    // Show native Android install prompt
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to installation prompt:', outcome);

    deferredPrompt = null;
    installPwaBtn.classList.add('hidden');
  });
}

// 3. Listen for successful installation
window.addEventListener('appinstalled', () => {
  console.log('[PWA] Weight Tracker installed to device.');
  if (installPwaBtn) {
    installPwaBtn.classList.add('hidden');
  }
  showFeedback('Weight Tracker installed to your home screen! 🎉', 'success');
});
