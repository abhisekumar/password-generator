(function () {
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const NUMBERS = "0123456789";
  const SYMBOLS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~";

  const passwordEl = document.getElementById("password");
  const lengthEl = document.getElementById("length");
  const lengthValueEl = document.getElementById("lengthValue");
  const uppercaseEl = document.getElementById("uppercase");
  const lowercaseEl = document.getElementById("lowercase");
  const numbersEl = document.getElementById("numbers");
  const symbolsEl = document.getElementById("symbols");
  const strengthFillEl = document.getElementById("strengthFill");
  const strengthTextEl = document.getElementById("strengthText");
  const strengthBarEl = document.querySelector(".strength-bar");
  const toggleVisibilityBtn = document.getElementById("toggleVisibility");
  const regenerateBtn = document.getElementById("regenerate");
  const copyBtn = document.getElementById("copy");
  const iconEye = document.getElementById("iconEye");
  const iconEyeOff = document.getElementById("iconEyeOff");
  const iconCopy = document.getElementById("iconCopy");
  const iconCheck = document.getElementById("iconCheck");

  let hidden = true;

  function updateSliderProgress() {
    const min = Number(lengthEl.min);
    const max = Number(lengthEl.max);
    const value = Number(lengthEl.value);
    const progress = ((value - min) / (max - min)) * 100;
    lengthEl.style.setProperty("--progress", progress + "%");
    lengthEl.setAttribute("aria-valuenow", String(value));
    lengthValueEl.textContent = String(value);
  }

  function getCharset() {
    let charset = "";
    const required = [];

    if (uppercaseEl.checked) {
      charset += UPPER;
      required.push(UPPER);
    }
    if (lowercaseEl.checked) {
      charset += LOWER;
      required.push(LOWER);
    }
    if (numbersEl.checked) {
      charset += NUMBERS;
      required.push(NUMBERS);
    }
    if (symbolsEl.checked) {
      charset += SYMBOLS;
      required.push(SYMBOLS);
    }

    return { charset, required };
  }

  function secureRandomInt(max) {
    const array = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do {
      crypto.getRandomValues(array);
      value = array[0];
    } while (value >= limit);
    return value % max;
  }

  function pickChar(pool) {
    return pool[secureRandomInt(pool.length)];
  }

  function shuffle(chars) {
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = secureRandomInt(i + 1);
      const temp = chars[i];
      chars[i] = chars[j];
      chars[j] = temp;
    }
    return chars;
  }

  function generatePassword() {
    const length = Number(lengthEl.value);
    const { charset, required } = getCharset();

    if (!charset) {
      passwordEl.value = "";
      updateStrength("");
      return;
    }

    const chars = [];

    required.forEach(function (pool) {
      chars.push(pickChar(pool));
    });

    while (chars.length < length) {
      chars.push(pickChar(charset));
    }

    passwordEl.value = shuffle(chars).slice(0, length).join("");
    updateStrength(passwordEl.value);
  }

  function scorePassword(password) {
    if (!password) return 0;

    let score = 0;
    const length = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    const variety = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (variety >= 3) score += 1;
    if (variety === 4 && length >= 12) score += 1;

    return Math.min(score, 4);
  }

  function updateStrength(password) {
    const level = scorePassword(password);
    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    strengthFillEl.className = "strength-fill level-" + level;
    strengthTextEl.textContent = password ? labels[level] : "—";
    strengthBarEl.setAttribute("aria-valuenow", String(level));
  }

  function setVisibility(isHidden) {
    hidden = isHidden;
    passwordEl.classList.toggle("masked", hidden);
    iconEye.classList.toggle("hidden", hidden);
    iconEyeOff.classList.toggle("hidden", !hidden);
    toggleVisibilityBtn.setAttribute(
      "aria-label",
      hidden ? "Show password" : "Hide password"
    );
    toggleVisibilityBtn.title = hidden ? "Show password" : "Hide password";
  }

  async function copyPassword() {
    const value = passwordEl.value;
    if (!value) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        passwordEl.select();
        document.execCommand("copy");
        window.getSelection().removeAllRanges();
      }

      iconCopy.classList.add("hidden");
      iconCheck.classList.remove("hidden");
      copyBtn.classList.add("copied");
      copyBtn.setAttribute("aria-label", "Copied");
      copyBtn.title = "Copied";

      window.setTimeout(function () {
        iconCopy.classList.remove("hidden");
        iconCheck.classList.add("hidden");
        copyBtn.classList.remove("copied");
        copyBtn.setAttribute("aria-label", "Copy password");
        copyBtn.title = "Copy password";
      }, 1200);
    } catch (error) {
      copyBtn.title = "Copy failed";
    }
  }

  function ensureAtLeastOneOption(changedEl) {
    const boxes = [uppercaseEl, lowercaseEl, numbersEl, symbolsEl];
    const anyChecked = boxes.some(function (box) {
      return box.checked;
    });

    if (!anyChecked) {
      changedEl.checked = true;
    }
  }

  lengthEl.addEventListener("input", function () {
    updateSliderProgress();
    generatePassword();
  });

  [uppercaseEl, lowercaseEl, numbersEl, symbolsEl].forEach(function (el) {
    el.addEventListener("change", function () {
      ensureAtLeastOneOption(el);
      generatePassword();
    });
  });

  toggleVisibilityBtn.addEventListener("click", function () {
    setVisibility(!hidden);
  });

  regenerateBtn.addEventListener("click", generatePassword);
  copyBtn.addEventListener("click", copyPassword);

  updateSliderProgress();
  setVisibility(true);
  generatePassword();
})();
